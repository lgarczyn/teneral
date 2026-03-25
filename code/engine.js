// ── Engine ────────────────────────────────────────────────────────

var ROLE_DEFS = {};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMap(players) {
  return new Map(players.map((p) => [p.id, p]));
}

function setRole(player, targetId, role, confidence) {
  const cur = player.roleConfidence[targetId] ?? 0;
  if (cur >= 1.0) return;
  if (confidence >= cur) {
    player.roleBelief[targetId] = role;
    player.roleConfidence[targetId] = confidence;
  }
}

function trustOf(listener, sid) {
  return 1 - (listener.factionBelief[sid] || 0);
}
function isAlienTeam(p) {
  return p.role === "alien" || p.infected;
}

function honestGossip(speaker, listener) {
  const trust = trustOf(listener, speaker.id);
  for (const [k, val] of Object.entries(speaker.factionBelief)) {
    const id = +k;
    if (id === listener.id) continue;
    listener.factionBelief[id] = Math.min(
      1,
      (listener.factionBelief[id] || 0) + val * trust * 0.21,
    );
  }
  for (const [k, role] of Object.entries(speaker.roleBelief)) {
    const id = +k;
    if (id === listener.id) continue;
    setRole(
      listener,
      id,
      role,
      (speaker.roleConfidence[id] ?? 0) * trust * 0.6,
    );
  }
}

function adversarialGossip(speaker, listener, all) {
  const targets = all.filter(
    (p) => p.alive && p.id !== speaker.id && !isAlienTeam(p),
  );
  if (targets.length) {
    const tgt = targets[Math.floor(Math.random() * targets.length)];
    listener.factionBelief[tgt.id] = Math.min(
      1,
      (listener.factionBelief[tgt.id] || 0) +
        0.25 * trustOf(listener, speaker.id),
    );
  }
  listener.factionBelief[speaker.id] = Math.max(
    0,
    (listener.factionBelief[speaker.id] || 0) -
      0.1 * trustOf(listener, speaker.id),
  );
}

function gossip(speaker, listener, all) {
  if (isAlienTeam(speaker)) adversarialGossip(speaker, listener, all);
  else ROLE_DEFS[speaker.role]?.gossip(speaker, listener, all);
}

function mkPlayer(role, id, name) {
  const player = {
    id,
    name: name ?? `P${id + 1}`,
    role,
    infected: ROLE_DEFS[role]?.startInfected ?? false,
    alive: true,
    infectedBy: null,
    killUsed: true,
    lieUsed: false,
    factionBelief: {},
    roleBelief: {},
    roleConfidence: {},
    roomId: null,
  };
  ROLE_DEFS[role]?.initPlayer?.(player);
  return player;
}

const ROOM_NAMES = [
  "Kitchen",
  "Lounge",
  "Hallway",
  "Library",
  "Basement",
  "Attic",
  "Garden",
  "Study",
  "Cellar",
  "Foyer",
  "Lab",
  "Vault",
];
const roomName = (i) => ROOM_NAMES[i] ?? `Room ${i + 1}`;

function createGame(cfg) {
  const {
    nPlayers,
    nAliens,
    nDoctors,
    nDuelists = 0,
    nImmune = 0,
    nEmpaths = 0,
    nPredisposed = 0,
    nRooms,
    voteThreshold = 0.7,
  } = cfg;
  const nHumans = Math.max(
    0,
    nPlayers -
      nAliens -
      nDoctors -
      nDuelists -
      nImmune -
      nEmpaths -
      nPredisposed,
  );
  const roles = shuffle([
    ...Array(nAliens).fill("alien"),
    ...Array(nDoctors).fill("doctor"),
    ...Array(nDuelists).fill("duelist"),
    ...Array(nImmune).fill("immune"),
    ...Array(nEmpaths).fill("empath"),
    ...Array(nPredisposed).fill("predisposed"),
    ...Array(nHumans).fill("human"),
  ]);
  const counts = {};
  const players = roles.map((role, i) => {
    counts[role] = (counts[role] || 0) + 1;
    return mkPlayer(
      role,
      i,
      `${ROLE_DEFS[role]?.prefix ?? role}_${counts[role]}`,
    );
  });
  const rooms = Array.from({ length: nRooms }, (_, i) => ({
    id: i,
    name: roomName(i),
  }));
  return {
    players,
    rooms,
    tick: 0,
    log: [],
    winner: null,
    cfg,
    pendingEvents: [],
    lastEvent: null,
  };
}

function checkWin(players) {
  const alive = players.filter((p) => p.alive);
  if (!alive.length) return "humans";
  if (
    alive.length === 2 &&
    alive.some(isAlienTeam) &&
    alive.some((p) => !isAlienTeam(p))
  )
    return "tie";
  if (alive.every(isAlienTeam)) return "aliens";
  if (alive.every((p) => !isAlienTeam(p))) return "humans";
  return null;
}

function applyReveal(a, b, all) {
  const events = [];

  // Phase 1: Scans (non-exclusive, e.g. empath)
  for (const [self, other] of [
    [a, b],
    [b, a],
  ]) {
    const rd = ROLE_DEFS[self.role];
    if (rd?.scan) {
      const result = rd.scan(self, other, all);
      if (result) {
        events.push(...result);
        break;
      }
    }
  }

  // Phase 2: Actions (exclusive, sorted by priority)
  const candidates = [];
  for (const [self, other] of [
    [a, b],
    [b, a],
  ]) {
    const rd = ROLE_DEFS[self.role];
    if (rd?.reveal) candidates.push({ self, other, rd });
  }
  candidates.sort(
    (x, y) => (x.rd.revealPriority ?? 99) - (y.rd.revealPriority ?? 99),
  );

  for (const { self, other, rd } of candidates) {
    const result = rd.reveal(self, other, all);
    if (result) {
      events.push(...result);
      return events;
    }
  }

  return events;
}

function assignRooms(players, rooms) {
  const alive = shuffle(players.filter((p) => p.alive));
  const occ = new Map(rooms.map((r) => [r.id, []]));
  const seen = new Set();
  for (const p of alive) {
    if (seen.has(p.id)) continue;
    const cands = rooms.filter((r) => occ.get(r.id).length < 3);
    const pool = cands.length
      ? cands
      : [...rooms]
          .sort((a, b) => occ.get(a.id).length - occ.get(b.id).length)
          .slice(0, 1);
    const scores = pool.map((r) => {
      const ids = occ.get(r.id);
      const susp = ids.reduce((s, id) => s + (p.factionBelief[id] || 0), 0);
      return Math.max(
        0.01,
        Math.exp(-susp * 2.5) + (ROLE_DEFS[p.role]?.movementScore(p, ids) ?? 0),
      );
    });
    const total = scores.reduce((a, b) => a + b, 0);
    let chosen = pool[0],
      rand = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      rand -= scores[i];
      if (rand <= 0) {
        chosen = pool[i];
        break;
      }
    }
    p.roomId = chosen.id;
    occ.get(chosen.id).push(p.id);
    seen.add(p.id);
  }
  return Object.fromEntries(occ);
}

const GK_THRESH = 0.4;

function applyGroupKill(ids, pm) {
  if (ids.length !== 3) return null;
  const alive = ids.map((id) => pm.get(id)).filter((p) => p?.alive);
  if (alive.length !== 3) return null;
  const [a, b, c] = alive;
  const triples = [
    [a, b, c],
    [a, c, b],
    [b, c, a],
  ];
  const scored = triples
    .map(([k1, k2, v]) => ({
      k1,
      k2,
      victim: v,
      score: (k1.factionBelief[v.id] ?? 0) + (k2.factionBelief[v.id] ?? 0),
      ok:
        (k1.factionBelief[v.id] ?? 0) >= GK_THRESH &&
        (k2.factionBelief[v.id] ?? 0) >= GK_THRESH,
    }))
    .sort((x, y) => y.score - x.score);
  for (const { k1, k2, victim, ok } of scored) {
    if (!ok) continue;
    victim.alive = false;
    return {
      type: "group_kill",
      killers: [k1.id, k2.id],
      victim: victim.id,
      killersInfected: [isAlienTeam(k1), isAlienTeam(k2)],
      victimInfected: isAlienTeam(victim),
    };
  }
  return null;
}

function propagateGroupKill(evt, all) {
  const [k1, k2] = evt.killers;
  for (const p of all) {
    if (!p.alive || p.id === k1 || p.id === k2 || p.id === evt.victim) continue;
    const avg = ((p.factionBelief[k1] ?? 0) + (p.factionBelief[k2] ?? 0)) / 2;
    p.factionBelief[k1] = avg;
    p.factionBelief[k2] = avg;
    p.factionBelief[evt.victim] = Math.min(1, Math.max(0, 1 - avg));
  }
}

function shouldVote(players, thresh) {
  return players.some((p) => {
    if (!p.alive || isAlienTeam(p)) return false;
    if (
      Object.entries(p.roleConfidence).some(([id, c]) => {
        const t = players.find((x) => x.id === +id);
        return c >= 1.0 && p.roleBelief[+id] === "alien" && t?.alive;
      })
    )
      return true;
    return Object.values(p.factionBelief).some((v) => v >= thresh);
  });
}

function runVote(players) {
  const alive = players.filter((p) => p.alive);
  const tally = {};
  for (const voter of alive) {
    const locked = alive.find(
      (p) =>
        (voter.roleConfidence[p.id] ?? 0) >= 1.0 &&
        voter.roleBelief[p.id] === "alien",
    );
    const tid = locked
      ? locked.id
      : alive
          .filter(
            (p) => p.id !== voter.id && (voter.factionBelief[p.id] || 0) > 0.2,
          )
          .sort(
            (a, b) =>
              (voter.factionBelief[b.id] || 0) -
              (voter.factionBelief[a.id] || 0),
          )[0]?.id;
    if (tid != null) tally[tid] = (tally[tid] || 0) + 1;
  }
  if (!Object.keys(tally).length) return null;
  const max = Math.max(...Object.values(tally));
  const top = Object.entries(tally)
    .filter(([, v]) => v === max)
    .map(([id]) => +id);
  if (top.length !== 1) return null;
  const elim = players.find((p) => p.id === top[0]);
  if (elim) elim.alive = false;
  return elim;
}

const NOTABLE = new Set([
  "infect",
  "infect_immune",
  "heal",
  "false_heal",
  "kill",
  "group_kill",
  "vote",
]);

function runTick(state) {
  const s = JSON.parse(JSON.stringify(state));
  s.tick++;
  const pm = buildMap(s.players);
  const occ = assignRooms(s.players, s.rooms);
  const events = [];

  for (const [rid, ids] of Object.entries(occ)) {
    const alive = ids.filter((id) => pm.get(id)?.alive);
    if (alive.length === 2) {
      const [a, b] = alive.map((id) => pm.get(id));
      events.push(
        ...applyReveal(a, b, s.players).map((e) => ({ ...e, roomId: +rid })),
      );
      gossip(a, b, s.players);
      gossip(b, a, s.players);
    } else if (alive.length >= 2) {
      const ke = applyGroupKill(alive, pm);
      if (ke) {
        events.push({ ...ke, roomId: +rid });
        propagateGroupKill(ke, s.players);
      }
      const surv = alive.filter((id) => pm.get(id)?.alive);
      for (let i = 0; i < surv.length; i++)
        for (let j = 0; j < surv.length; j++)
          if (i !== j) gossip(pm.get(surv[i]), pm.get(surv[j]), s.players);
    }
  }

  if (shouldVote(s.players, s.cfg.voteThreshold)) {
    const elim = runVote(s.players);
    events.push({
      type: "vote",
      elimId: elim?.id ?? null,
      elimRole: elim?.role ?? null,
      elimInfected: elim?.infected ?? false,
    });
  }

  s.winner = checkWin(s.players);
  if (s.winner) events.push({ type: "end" });

  const notable = events.filter((e) => NOTABLE.has(e.type));
  s.log.push({
    tick: s.tick,
    events: notable,
    rooms: Object.fromEntries(
      Object.entries(occ).map(([k, v]) => [
        k,
        [...new Set(v)].filter((id) => pm.get(id)?.alive),
      ]),
    ),
  });
  s.pendingEvents = notable.slice(1);
  s.lastEvent = notable[0] ?? null;
  return s;
}

function stepGameEvent(state) {
  if (state.winner) return state;
  if (state.pendingEvents && state.pendingEvents.length > 0) {
    const s = JSON.parse(JSON.stringify(state));
    s.lastEvent = s.pendingEvents.shift();
    const last = s.log[s.log.length - 1];
    if (
      last &&
      !last.events.some(
        (e) => JSON.stringify(e) === JSON.stringify(s.lastEvent),
      )
    )
      last.events.push(s.lastEvent);
    return s;
  }
  return runTick(state);
}

function stepGame(state) {
  if (state.winner) return state;
  const s = runTick(state);
  s.pendingEvents = [];
  return s;
}

function runFullGame(cfg, max = 120) {
  let s = createGame(cfg);
  while (!s.winner && s.tick < max) s = stepGame(s);
  if (!s.winner) s.winner = "timeout";
  return s;
}

function runMonteCarlo(cfg, n) {
  let aW = 0,
    hW = 0,
    ti = 0,
    to = 0;
  const dist = {};
  for (let i = 0; i < n; i++) {
    const r = runFullGame(cfg);
    if (r.winner === "aliens") aW++;
    else if (r.winner === "humans") hW++;
    else if (r.winner === "tie") ti++;
    else to++;
    dist[r.tick] = (dist[r.tick] || 0) + 1;
  }
  const avg = Object.entries(dist).reduce((s, [t, c]) => s + +t * c, 0) / n;
  return {
    alienWins: aW,
    humanWins: hW,
    ties: ti,
    timeouts: to,
    total: n,
    avgTicks: avg,
    distArr: Object.entries(dist)
      .sort((a, b) => +a[0] - +b[0])
      .map(([t, c]) => ({ tick: +t, count: c })),
  };
}

const DEFAULT_CFG = {
  nPlayers: 10,
  nRooms: 5,
  nAliens: 2,
  nDoctors: 3,
  nDuelists: 1,
  nImmune: 1,
  nEmpaths: 1,
  nPredisposed: 0,
  voteThreshold: 0.7,
};
