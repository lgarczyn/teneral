// ── Engine ────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMap(players) { return new Map(players.map(p => [p.id, p])); }

function setRole(player, targetId, role, confidence) {
  const cur = player.roleConfidence[targetId] ?? 0;
  if (cur >= 1.0) return;
  if (confidence >= cur) { player.roleBelief[targetId] = role; player.roleConfidence[targetId] = confidence; }
}

function trustOf(listener, sid) { return 1 - (listener.factionBelief[sid] || 0); }
export function isAlienTeam(p) { return p.role === "alien" || p.infected; }

function honestGossip(speaker, listener) {
  const trust = trustOf(listener, speaker.id);
  for (const [k, val] of Object.entries(speaker.factionBelief)) {
    const id = +k; if (id === listener.id) continue;
    listener.factionBelief[id] = Math.min(1, (listener.factionBelief[id] || 0) + val * trust * 0.21);
  }
  for (const [k, role] of Object.entries(speaker.roleBelief)) {
    const id = +k; if (id === listener.id) continue;
    setRole(listener, id, role, (speaker.roleConfidence[id] ?? 0) * trust * 0.6);
  }
}

function adversarialGossip(speaker, listener, all) {
  const targets = all.filter(p => p.alive && p.id !== speaker.id && !isAlienTeam(p));
  if (targets.length) {
    const tgt = targets[Math.floor(Math.random() * targets.length)];
    listener.factionBelief[tgt.id] = Math.min(1, (listener.factionBelief[tgt.id] || 0) + 0.25 * trustOf(listener, speaker.id));
  }
  listener.factionBelief[speaker.id] = Math.max(0, (listener.factionBelief[speaker.id] || 0) - 0.1 * trustOf(listener, speaker.id));
}

export const ROLE_DEFS = {
  alien:       { prefix:"Alien", startInfected:false, ui:{letter:"A",color:"#ef4444",border:"border-red-600"},
    gossip:adversarialGossip, movementScore(p,occ){const c=occ.filter(id=>(p.factionBelief[id]||0)<0.3);return occ.length===1&&c.length===1?1:0;}},
  doctor:      { prefix:"Doc",   startInfected:false, ui:{letter:"D",color:"#3b82f6",border:"border-blue-500"},
    gossip:honestGossip, movementScore(p,occ){let b=0;for(const id of occ){const fb=p.factionBelief[id]??0;const ca=p.roleBelief[id]==="alien"&&(p.roleConfidence[id]??0)>=1;if(fb>0.4&&!ca)b+=fb;}return b;}},
  human:       { prefix:"Crew",  startInfected:false, ui:{letter:"H",color:"#6b7280",border:"border-gray-600"},   gossip:honestGossip, movementScore:()=>0 },
  duelist:     { prefix:"Duel",  startInfected:false, ui:{letter:"U",color:"#f59e0b",border:"border-amber-500"},  gossip:honestGossip, movementScore:()=>0 },
  immune:      { prefix:"Imm",   startInfected:false, ui:{letter:"I",color:"#22d3ee",border:"border-cyan-500"},   gossip:honestGossip, movementScore:()=>0 },
  empath:      { prefix:"Emp",   startInfected:false, ui:{letter:"E",color:"#a78bfa",border:"border-violet-500"}, gossip:honestGossip, movementScore:()=>0 },
  predisposed: { prefix:"Pre",   startInfected:true,  ui:{letter:"P",color:"#f97316",border:"border-orange-500"}, gossip:adversarialGossip, movementScore:()=>0 },
};

function gossip(speaker, listener, all) {
  if (isAlienTeam(speaker)) adversarialGossip(speaker, listener, all);
  else ROLE_DEFS[speaker.role]?.gossip(speaker, listener, all);
}

function mkPlayer(role, id, name) {
  return { id, name: name ?? `P${id+1}`, role,
    infected: ROLE_DEFS[role]?.startInfected ?? false,
    alive: true, infectedBy: null, killUsed: role !== "duelist", lieUsed: false,
    factionBelief: {}, roleBelief: {}, roleConfidence: {}, roomId: null };
}

const ROOM_NAMES = ["Kitchen","Lounge","Hallway","Library","Basement","Attic","Garden","Study","Cellar","Foyer","Lab","Vault"];
const roomName = i => ROOM_NAMES[i] ?? `Room ${i+1}`;

export function createGame(cfg) {
  const {nPlayers,nAliens,nDoctors,nDuelists=0,nImmune=0,nEmpaths=0,nPredisposed=0,nRooms,voteThreshold=0.7} = cfg;
  const nHumans = Math.max(0, nPlayers-nAliens-nDoctors-nDuelists-nImmune-nEmpaths-nPredisposed);
  const roles = shuffle([
    ...Array(nAliens).fill("alien"),...Array(nDoctors).fill("doctor"),
    ...Array(nDuelists).fill("duelist"),...Array(nImmune).fill("immune"),
    ...Array(nEmpaths).fill("empath"),...Array(nPredisposed).fill("predisposed"),
    ...Array(nHumans).fill("human"),
  ]);
  const counts = {};
  const players = roles.map((role, i) => {
    counts[role] = (counts[role] || 0) + 1;
    return mkPlayer(role, i, `${ROLE_DEFS[role]?.prefix ?? role}_${counts[role]}`);
  });
  const rooms = Array.from({length:nRooms}, (_, i) => ({id:i, name:roomName(i)}));
  return {players, rooms, tick:0, log:[], winner:null, cfg, pendingEvents:[], lastEvent:null};
}

function checkWin(players) {
  const alive = players.filter(p => p.alive);
  if (!alive.length) return "humans";
  if (alive.length === 2 && alive.some(isAlienTeam) && alive.some(p => !isAlienTeam(p))) return "tie";
  if (alive.every(isAlienTeam)) return "aliens";
  if (alive.every(p => !isAlienTeam(p))) return "humans";
  return null;
}

function applyReveal(a, b, all) {
  const events = [];

  for (const [emp, other] of [[a,b],[b,a]]) {
    if (emp.role !== "empath") continue;
    emp.roleBelief[other.id] = other.role; emp.roleConfidence[other.id] = 1.0;
    setRole(other, emp.id, "empath", 1.0);
    emp.factionBelief[other.id] = (other.role==="alien"||other.role==="predisposed") ? 1 : Math.min(emp.factionBelief[other.id]??1, 0.1);
    events.push({type:"empath_scan", from:emp.id, to:other.id, revealed:other.role, fromInfected:isAlienTeam(emp), toInfected:isAlienTeam(other)});
    break;
  }

  for (const [att, tgt] of [[a,b],[b,a]]) {
    if (att.role !== "alien") continue;
    if (!tgt.alive || tgt.infected || tgt.role==="alien" || tgt.role==="predisposed") continue;
    if (tgt.role === "immune") {
      att.factionBelief[tgt.id] = 1; tgt.factionBelief[att.id] = 1; setRole(tgt, att.id, "alien", 1.0);
      events.push({type:"infect_immune", from:att.id, to:tgt.id}); return events;
    }
    tgt.infected = true; tgt.infectedBy = att.id;
    tgt.factionBelief[att.id] = 1; setRole(tgt, att.id, "alien", 1.0); att.factionBelief[tgt.id] = 1;
    events.push({type:"infect", from:att.id, to:tgt.id, fromInfected:false, toInfected:true}); return events;
  }

  for (const [doc, pat] of [[a,b],[b,a]]) {
    if (doc.role !== "doctor" || doc.infected || !pat.alive || !pat.infected) continue;
    pat.factionBelief[doc.id] = 0; setRole(pat, doc.id, "doctor", 1.0);
    if (pat.role === "predisposed") {
      if (!pat.lieUsed) {
        const pool = all.filter(p => p.alive && p.id!==doc.id && p.id!==pat.id && !isAlienTeam(p));
        if (pool.length) {
          pat.lieUsed = true;
          const sc = pool[Math.floor(Math.random()*pool.length)];
          doc.factionBelief[sc.id] = Math.min(1, (doc.factionBelief[sc.id]||0) + 0.6);
          doc.factionBelief[pat.id] = 0;
          events.push({type:"false_heal", from:doc.id, to:pat.id, framed:sc.id, fromInfected:false, toInfected:true}); return events;
        }
      }
      doc.factionBelief[pat.id] = Math.min(1, (doc.factionBelief[pat.id]||0) + 0.5);
      events.push({type:"false_heal", from:doc.id, to:pat.id, framed:null, fromInfected:false, toInfected:true}); return events;
    }
    const infector = pat.infectedBy; pat.infected = false; pat.infectedBy = null; doc.factionBelief[pat.id] = 0;
    if (infector != null) {
      doc.factionBelief[infector] = 1; setRole(doc, infector, "alien", 1.0);
      pat.factionBelief[infector] = 1; setRole(pat, infector, "alien", 1.0);
    }
    events.push({type:"heal", from:doc.id, to:pat.id, fromInfected:false, toInfected:false}); return events;
  }

  for (const [du, tgt] of [[a,b],[b,a]]) {
    if (du.role !== "duelist" || du.infected || du.killUsed || !tgt.alive) continue;
    if ((du.factionBelief[tgt.id]||0) > 0.55) {
      du.killUsed = true; tgt.alive = false;
      events.push({type:"kill", from:du.id, to:tgt.id, fromInfected:du.infected, toInfected:tgt.infected}); break;
    }
  }
  return events;
}

function assignRooms(players, rooms) {
  const alive = shuffle(players.filter(p => p.alive));
  const occ = new Map(rooms.map(r => [r.id, []]));
  const seen = new Set();
  for (const p of alive) {
    if (seen.has(p.id)) continue;
    const cands = rooms.filter(r => occ.get(r.id).length < 3);
    const pool = cands.length ? cands : [...rooms].sort((a,b) => occ.get(a.id).length - occ.get(b.id).length).slice(0,1);
    const scores = pool.map(r => {
      const ids = occ.get(r.id);
      const susp = ids.reduce((s,id) => s + (p.factionBelief[id]||0), 0);
      return Math.max(0.01, Math.exp(-susp*2.5) + (ROLE_DEFS[p.role]?.movementScore(p,ids)??0));
    });
    const total = scores.reduce((a,b) => a+b, 0);
    let chosen = pool[0], rand = Math.random() * total;
    for (let i = 0; i < pool.length; i++) { rand -= scores[i]; if (rand <= 0) { chosen = pool[i]; break; } }
    p.roomId = chosen.id; occ.get(chosen.id).push(p.id); seen.add(p.id);
  }
  return Object.fromEntries(occ);
}

const GK_THRESH = 0.4;

function applyGroupKill(ids, pm) {
  if (ids.length !== 3) return null;
  const alive = ids.map(id => pm.get(id)).filter(p => p?.alive);
  if (alive.length !== 3) return null;
  const [a,b,c] = alive;
  const triples = [[a,b,c],[a,c,b],[b,c,a]];
  const scored = triples.map(([k1,k2,v]) => ({
    k1, k2, victim:v,
    score: (k1.factionBelief[v.id]??0)+(k2.factionBelief[v.id]??0),
    ok: (k1.factionBelief[v.id]??0)>=GK_THRESH && (k2.factionBelief[v.id]??0)>=GK_THRESH,
  })).sort((x,y) => y.score-x.score);
  for (const {k1,k2,victim,ok} of scored) {
    if (!ok) continue;
    victim.alive = false;
    return {type:"group_kill", killers:[k1.id,k2.id], victim:victim.id,
      killersInfected:[isAlienTeam(k1),isAlienTeam(k2)], victimInfected:isAlienTeam(victim)};
  }
  return null;
}

function propagateGroupKill(evt, all) {
  const [k1,k2] = evt.killers;
  for (const p of all) {
    if (!p.alive || p.id===k1 || p.id===k2 || p.id===evt.victim) continue;
    const avg = ((p.factionBelief[k1]??0)+(p.factionBelief[k2]??0))/2;
    p.factionBelief[k1] = avg; p.factionBelief[k2] = avg;
    p.factionBelief[evt.victim] = Math.min(1, Math.max(0, 1-avg));
  }
}

function shouldVote(players, thresh) {
  return players.some(p => {
    if (!p.alive || isAlienTeam(p)) return false;
    if (Object.entries(p.roleConfidence).some(([id,c]) => {
      const t = players.find(x => x.id===+id);
      return c>=1.0 && p.roleBelief[+id]==="alien" && t?.alive;
    })) return true;
    return Object.values(p.factionBelief).some(v => v >= thresh);
  });
}

function runVote(players) {
  const alive = players.filter(p => p.alive);
  const tally = {};
  for (const voter of alive) {
    const locked = alive.find(p => (voter.roleConfidence[p.id]??0)>=1.0 && voter.roleBelief[p.id]==="alien");
    const tid = locked ? locked.id
      : alive.filter(p => p.id!==voter.id && (voter.factionBelief[p.id]||0)>0.2)
              .sort((a,b) => (voter.factionBelief[b.id]||0)-(voter.factionBelief[a.id]||0))[0]?.id;
    if (tid != null) tally[tid] = (tally[tid]||0)+1;
  }
  if (!Object.keys(tally).length) return null;
  const max = Math.max(...Object.values(tally));
  const top = Object.entries(tally).filter(([,v])=>v===max).map(([id])=>+id);
  if (top.length !== 1) return null;
  const elim = players.find(p => p.id===top[0]);
  if (elim) elim.alive = false;
  return elim;
}

const NOTABLE = new Set(["infect","infect_immune","heal","false_heal","kill","group_kill","vote"]);

function runTick(state) {
  const s = JSON.parse(JSON.stringify(state));
  s.tick++;
  const pm = buildMap(s.players);
  const occ = assignRooms(s.players, s.rooms);
  const events = [];

  for (const [rid, ids] of Object.entries(occ)) {
    const alive = ids.filter(id => pm.get(id)?.alive);
    if (alive.length === 2) {
      const [a,b] = alive.map(id => pm.get(id));
      events.push(...applyReveal(a,b,s.players).map(e => ({...e, roomId:+rid})));
      for (const [emp,other] of [[a,b],[b,a]]) {
        if (emp.role==="empath" && isAlienTeam(emp)) {
          for (const p of s.players) {
            if (p.alive && isAlienTeam(p) && p.id!==emp.id) {
              setRole(p, other.id, other.role, emp.roleConfidence[other.id]??0);
              p.factionBelief[other.id] = emp.factionBelief[other.id]??0;
            }
          }
        }
      }
      gossip(a,b,s.players); gossip(b,a,s.players);
    } else if (alive.length >= 2) {
      const ke = applyGroupKill(alive, pm);
      if (ke) { events.push({...ke, roomId:+rid}); propagateGroupKill(ke, s.players); }
      const surv = alive.filter(id => pm.get(id)?.alive);
      for (let i=0;i<surv.length;i++) for (let j=0;j<surv.length;j++)
        if (i!==j) gossip(pm.get(surv[i]), pm.get(surv[j]), s.players);
    }
  }

  if (shouldVote(s.players, s.cfg.voteThreshold)) {
    const elim = runVote(s.players);
    events.push({type:"vote", elimId:elim?.id??null, elimRole:elim?.role??null, elimInfected:elim?.infected??false});
  }

  s.winner = checkWin(s.players);
  if (s.winner) events.push({type:"end"});

  const notable = events.filter(e => NOTABLE.has(e.type));
  s.log.push({tick:s.tick, events:notable,
    rooms:Object.fromEntries(Object.entries(occ).map(([k,v])=>[k,[...new Set(v)].filter(id=>pm.get(id)?.alive)]))});
  s.pendingEvents = notable.slice(1);
  s.lastEvent = notable[0] ?? null;
  return s;
}

export function stepGameEvent(state) {
  if (state.winner) return state;
  if (state.pendingEvents && state.pendingEvents.length > 0) {
    const s = JSON.parse(JSON.stringify(state));
    s.lastEvent = s.pendingEvents.shift();
    const last = s.log[s.log.length-1];
    if (last && !last.events.some(e => JSON.stringify(e)===JSON.stringify(s.lastEvent)))
      last.events.push(s.lastEvent);
    return s;
  }
  return runTick(state);
}

export function stepGame(state) {
  if (state.winner) return state;
  const s = runTick(state); s.pendingEvents = []; return s;
}

export function runFullGame(cfg, max=120) {
  let s = createGame(cfg);
  while (!s.winner && s.tick < max) s = stepGame(s);
  if (!s.winner) s.winner = "timeout";
  return s;
}

export function runMonteCarlo(cfg, n) {
  let aW=0,hW=0,ti=0,to=0; const dist={};
  for (let i=0;i<n;i++) {
    const r = runFullGame(cfg);
    if (r.winner==="aliens") aW++; else if (r.winner==="humans") hW++;
    else if (r.winner==="tie") ti++; else to++;
    dist[r.tick] = (dist[r.tick]||0)+1;
  }
  const avg = Object.entries(dist).reduce((s,[t,c])=>s+(+t)*c,0)/n;
  return {alienWins:aW, humanWins:hW, ties:ti, timeouts:to, total:n, avgTicks:avg,
    distArr:Object.entries(dist).sort((a,b)=>+a[0]-+b[0]).map(([t,c])=>({tick:+t,count:c}))};
}

export const DEFAULT_CFG = {nPlayers:10,nRooms:5,nAliens:2,nDoctors:3,nDuelists:1,nImmune:1,nEmpaths:1,nPredisposed:0,voteThreshold:0.7};
