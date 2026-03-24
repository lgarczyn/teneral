const { useState, useEffect, useRef, useCallback } = React;
const {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} = Recharts;

// ── Engine ────────────────────────────────────────────────────────

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

const ROLE_DEFS = {
  alien: {
    prefix: "Alien",
    startInfected: false,
    ui: { letter: "A", color: "#ef4444", border: "border-red-600" },
    gossip: adversarialGossip,
    movementScore(p, occ) {
      const c = occ.filter((id) => (p.factionBelief[id] || 0) < 0.3);
      return occ.length === 1 && c.length === 1 ? 1 : 0;
    },
  },
  doctor: {
    prefix: "Doc",
    startInfected: false,
    ui: { letter: "D", color: "#3b82f6", border: "border-blue-500" },
    gossip: honestGossip,
    movementScore(p, occ) {
      let b = 0;
      for (const id of occ) {
        const fb = p.factionBelief[id] ?? 0;
        const ca =
          p.roleBelief[id] === "alien" && (p.roleConfidence[id] ?? 0) >= 1;
        if (fb > 0.4 && !ca) b += fb;
      }
      return b;
    },
  },
  human: {
    prefix: "Crew",
    startInfected: false,
    ui: { letter: "H", color: "#6b7280", border: "border-gray-600" },
    gossip: honestGossip,
    movementScore: () => 0,
  },
  duelist: {
    prefix: "Duel",
    startInfected: false,
    ui: { letter: "U", color: "#f59e0b", border: "border-amber-500" },
    gossip: honestGossip,
    movementScore: () => 0,
  },
  immune: {
    prefix: "Imm",
    startInfected: false,
    ui: { letter: "I", color: "#22d3ee", border: "border-cyan-500" },
    gossip: honestGossip,
    movementScore: () => 0,
  },
  empath: {
    prefix: "Emp",
    startInfected: false,
    ui: { letter: "E", color: "#a78bfa", border: "border-violet-500" },
    gossip: honestGossip,
    movementScore: () => 0,
  },
  predisposed: {
    prefix: "Pre",
    startInfected: true,
    ui: { letter: "P", color: "#f97316", border: "border-orange-500" },
    gossip: adversarialGossip,
    movementScore: () => 0,
  },
};

function gossip(speaker, listener, all) {
  if (isAlienTeam(speaker)) adversarialGossip(speaker, listener, all);
  else ROLE_DEFS[speaker.role]?.gossip(speaker, listener, all);
}

function mkPlayer(role, id, name) {
  return {
    id,
    name: name ?? `P${id + 1}`,
    role,
    infected: ROLE_DEFS[role]?.startInfected ?? false,
    alive: true,
    infectedBy: null,
    killUsed: role !== "duelist",
    lieUsed: false,
    factionBelief: {},
    roleBelief: {},
    roleConfidence: {},
    roomId: null,
  };
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

  for (const [emp, other] of [
    [a, b],
    [b, a],
  ]) {
    if (emp.role !== "empath") continue;
    emp.roleBelief[other.id] = other.role;
    emp.roleConfidence[other.id] = 1.0;
    setRole(other, emp.id, "empath", 1.0);
    emp.factionBelief[other.id] =
      other.role === "alien" || other.role === "predisposed"
        ? 1
        : Math.min(emp.factionBelief[other.id] ?? 1, 0.1);
    events.push({
      type: "empath_scan",
      from: emp.id,
      to: other.id,
      revealed: other.role,
      fromInfected: isAlienTeam(emp),
      toInfected: isAlienTeam(other),
    });
    break;
  }

  for (const [att, tgt] of [
    [a, b],
    [b, a],
  ]) {
    if (att.role !== "alien") continue;
    if (
      !tgt.alive ||
      tgt.infected ||
      tgt.role === "alien" ||
      tgt.role === "predisposed"
    )
      continue;
    if (tgt.role === "immune") {
      att.factionBelief[tgt.id] = 1;
      tgt.factionBelief[att.id] = 1;
      setRole(tgt, att.id, "alien", 1.0);
      events.push({ type: "infect_immune", from: att.id, to: tgt.id });
      return events;
    }
    tgt.infected = true;
    tgt.infectedBy = att.id;
    tgt.factionBelief[att.id] = 1;
    setRole(tgt, att.id, "alien", 1.0);
    att.factionBelief[tgt.id] = 1;
    events.push({
      type: "infect",
      from: att.id,
      to: tgt.id,
      fromInfected: false,
      toInfected: true,
    });
    return events;
  }

  for (const [doc, pat] of [
    [a, b],
    [b, a],
  ]) {
    if (doc.role !== "doctor" || doc.infected || !pat.alive || !pat.infected)
      continue;
    pat.factionBelief[doc.id] = 0;
    setRole(pat, doc.id, "doctor", 1.0);
    if (pat.role === "predisposed") {
      if (!pat.lieUsed) {
        const pool = all.filter(
          (p) =>
            p.alive && p.id !== doc.id && p.id !== pat.id && !isAlienTeam(p),
        );
        if (pool.length) {
          pat.lieUsed = true;
          const sc = pool[Math.floor(Math.random() * pool.length)];
          doc.factionBelief[sc.id] = Math.min(
            1,
            (doc.factionBelief[sc.id] || 0) + 0.6,
          );
          doc.factionBelief[pat.id] = 0;
          events.push({
            type: "false_heal",
            from: doc.id,
            to: pat.id,
            framed: sc.id,
            fromInfected: false,
            toInfected: true,
          });
          return events;
        }
      }
      doc.factionBelief[pat.id] = Math.min(
        1,
        (doc.factionBelief[pat.id] || 0) + 0.5,
      );
      events.push({
        type: "false_heal",
        from: doc.id,
        to: pat.id,
        framed: null,
        fromInfected: false,
        toInfected: true,
      });
      return events;
    }
    const infector = pat.infectedBy;
    pat.infected = false;
    pat.infectedBy = null;
    doc.factionBelief[pat.id] = 0;
    if (infector != null) {
      doc.factionBelief[infector] = 1;
      setRole(doc, infector, "alien", 1.0);
      pat.factionBelief[infector] = 1;
      setRole(pat, infector, "alien", 1.0);
    }
    events.push({
      type: "heal",
      from: doc.id,
      to: pat.id,
      fromInfected: false,
      toInfected: false,
    });
    return events;
  }

  for (const [du, tgt] of [
    [a, b],
    [b, a],
  ]) {
    if (du.role !== "duelist" || du.infected || du.killUsed || !tgt.alive)
      continue;
    if ((du.factionBelief[tgt.id] || 0) > 0.55) {
      du.killUsed = true;
      tgt.alive = false;
      events.push({
        type: "kill",
        from: du.id,
        to: tgt.id,
        fromInfected: du.infected,
        toInfected: tgt.infected,
      });
      break;
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
      for (const [emp, other] of [
        [a, b],
        [b, a],
      ]) {
        if (emp.role === "empath" && isAlienTeam(emp)) {
          for (const p of s.players) {
            if (p.alive && isAlienTeam(p) && p.id !== emp.id) {
              setRole(
                p,
                other.id,
                other.role,
                emp.roleConfidence[other.id] ?? 0,
              );
              p.factionBelief[other.id] = emp.factionBelief[other.id] ?? 0;
            }
          }
        }
      }
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

// ── UI ────────────────────────────────────────────────────────────

const EVT_COLOR = {
  infect: "#fb923c",
  infect_immune: "#22d3ee",
  heal: "#60a5fa",
  false_heal: "#f97316",
  kill: "#f87171",
  group_kill: "#f87171",
  empath_scan: "#a78bfa",
  vote: "#facc15",
};

function fmtPlayer(players, id, infected) {
  const p = players[id];
  if (!p) return `?${id}`;
  return p.name + (infected ? "[inf]" : "");
}

function fmtEvent(e, players) {
  const p = (id, inf) => fmtPlayer(players, id, inf);
  switch (e.type) {
    case "infect":
      return `  ${p(e.from, false)} infected ${p(e.to, false)}`;
    case "infect_immune":
      return `  ${p(e.from, false)} tried ${p(e.to, false)} (immune)`;
    case "heal":
      return `  ${p(e.from, false)} healed ${p(e.to, false)}`;
    case "false_heal":
      return `  ${p(e.to, true)} lied to ${p(e.from, false)}${e.framed != null ? ` → framed ${p(e.framed, false)}` : ""}`;
    case "empath_scan":
      return `  ${p(e.from, e.fromInfected)} scanned ${p(e.to, e.toInfected)} → ${e.revealed}`;
    case "kill":
      return `  ${p(e.from, e.fromInfected)} killed ${p(e.to, e.toInfected)}`;
    case "group_kill":
      return `  ${p(e.killers[0], e.killersInfected?.[0])}+${p(e.killers[1], e.killersInfected?.[1])} → killed ${p(e.victim, e.victimInfected)}`;
    case "vote":
      return e.elimId != null
        ? `  vote: ${p(e.elimId, e.elimInfected)} out (${e.elimRole})`
        : "  vote: tie";
    default:
      return null;
  }
}

function Sigil({ role, color }) {
  const s = { width: "100%", height: "100%" };
  const c = color;
  if (role === "human")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <circle cx="45" cy="32" r="14" stroke={c} strokeWidth="1.5" />
        <circle cx="45" cy="32" r="5" fill={c} opacity="0.3" />
        <path d="M22 75 C22 55 68 55 68 75" stroke={c} strokeWidth="1.5" />
        <circle
          cx="45"
          cy="45"
          r="36"
          stroke={c}
          strokeWidth="0.5"
          strokeDasharray="3 6"
          opacity="0.2"
        />
      </svg>
    );
  if (role === "doctor")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <rect
          x="38"
          y="20"
          width="14"
          height="50"
          rx="3"
          stroke={c}
          strokeWidth="1.5"
          fill={c}
          fillOpacity="0.1"
        />
        <rect
          x="20"
          y="38"
          width="50"
          height="14"
          rx="3"
          stroke={c}
          strokeWidth="1.5"
          fill={c}
          fillOpacity="0.1"
        />
        <circle
          cx="45"
          cy="45"
          r="32"
          stroke={c}
          strokeWidth="0.5"
          strokeDasharray="2 5"
          opacity="0.25"
        />
      </svg>
    );
  if (role === "alien")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <ellipse cx="45" cy="36" rx="20" ry="16" stroke={c} strokeWidth="1.5" />
        <ellipse
          cx="45"
          cy="36"
          rx="7"
          ry="10"
          stroke={c}
          strokeWidth="1"
          fill={c}
          opacity="0.1"
        />
        <circle cx="37" cy="32" r="3.5" fill={c} opacity="0.7" />
        <circle cx="53" cy="32" r="3.5" fill={c} opacity="0.7" />
        <path
          d="M28 52 Q36 66 45 64 Q54 66 62 52"
          stroke={c}
          strokeWidth="1.2"
        />
        <path
          d="M21 48 Q14 38 17 27"
          stroke={c}
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.5"
        />
        <path
          d="M69 48 Q76 38 73 27"
          stroke={c}
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.5"
        />
      </svg>
    );
  if (role === "immune")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <path
          d="M45 14 L70 28 L70 52 Q70 70 45 78 Q20 70 20 52 L20 28 Z"
          stroke={c}
          strokeWidth="1.5"
        />
        <path
          d="M45 24 L62 34 L62 52 Q62 64 45 70 Q28 64 28 52 L28 34 Z"
          stroke={c}
          strokeWidth="0.7"
          fill={c}
          fillOpacity="0.05"
        />
        <path
          d="M33 46 L41 54 L57 38"
          stroke={c}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (role === "duelist")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <line
          x1="22"
          y1="22"
          x2="68"
          y2="68"
          stroke={c}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <line
          x1="68"
          y1="22"
          x2="22"
          y2="68"
          stroke={c}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <circle cx="45" cy="45" r="10" stroke={c} strokeWidth="1.2" />
        <circle cx="22" cy="22" r="3" fill={c} opacity="0.6" />
        <circle cx="68" cy="22" r="3" fill={c} opacity="0.6" />
        <circle cx="22" cy="68" r="3" fill={c} opacity="0.6" />
        <circle cx="68" cy="68" r="3" fill={c} opacity="0.6" />
      </svg>
    );
  if (role === "empath")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <ellipse cx="45" cy="45" rx="22" ry="14" stroke={c} strokeWidth="1.5" />
        <circle
          cx="45"
          cy="45"
          r="6"
          stroke={c}
          strokeWidth="1.2"
          fill={c}
          fillOpacity="0.2"
        />
        <circle cx="45" cy="45" r="2.5" fill={c} opacity="0.8" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a, i) => (
          <line
            key={i}
            x1={45 + Math.cos((a * Math.PI) / 180) * 28}
            y1={45 + Math.sin((a * Math.PI) / 180) * 28}
            x2={45 + Math.cos((a * Math.PI) / 180) * 36}
            y2={45 + Math.sin((a * Math.PI) / 180) * 36}
            stroke={c}
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.5"
          />
        ))}
      </svg>
    );
  if (role === "predisposed")
    return (
      <svg viewBox="0 0 90 90" fill="none" style={s}>
        <path
          d="M45 15 A30 30 0 0 1 75 45"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M75 45 A30 30 0 0 1 45 75"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M45 75 A30 30 0 0 1 15 45"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M15 45 A30 30 0 0 1 45 15"
          stroke={c}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4 4"
        />
        <path
          d="M45 45 L55 28"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M45 45 L65 52"
          stroke={c}
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M45 45 L38 65"
          stroke={c}
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path
          d="M45 45 L22 38"
          stroke={c}
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="56" cy="26" r="1.5" fill={c} opacity="0.6" />
        <circle cx="37" cy="67" r="1.5" fill={c} opacity="0.5" />
        <circle
          cx="45"
          cy="45"
          r="4"
          stroke={c}
          strokeWidth="1"
          fill={c}
          fillOpacity="0.2"
        />
      </svg>
    );
  return null;
}

function PlayerCard({ p, highlight }) {
  const ui = ROLE_DEFS[p.role]?.ui ?? ROLE_DEFS.human.ui;
  const infected = p.infected && p.role !== "alien" && p.role !== "predisposed";
  return (
    <div
      style={{
        width: 38,
        height: 44,
        opacity: p.alive ? 1 : 0.2,
        position: "relative",
        boxShadow: highlight ? `0 0 0 2px ${ui.color}` : "none",
      }}
      className={`rounded border-2 ${ui.border} select-none overflow-hidden ${infected ? "bg-orange-950" : "bg-gray-900"}`}
      title={`${p.name} · ${p.role}${infected ? " (infected)" : ""}${!p.alive ? " · dead" : ""}`}
    >
      <div style={{ position: "absolute", inset: 2, pointerEvents: "none" }}>
        <Sigil role={p.role} color={p.alive ? ui.color : "#374151"} />
      </div>
      {infected && (
        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-orange-500 z-10" />
      )}
      {!p.alive && (
        <span className="absolute inset-0 flex items-center justify-center text-gray-700 text-lg font-bold z-10">
          ✕
        </span>
      )}
    </div>
  );
}

function EventLog({ log, lastEvent, players }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [log, lastEvent]);
  const lastStr = lastEvent ? JSON.stringify(lastEvent) : null;
  return (
    <div
      ref={ref}
      className="h-32 overflow-y-auto text-xs font-mono bg-black/40 rounded p-2"
    >
      {log.map((entry, i) => (
        <div key={i}>
          <div style={{ borderTop: "1px solid #1f2937", margin: "2px 0" }} />
          {entry.events.map((e, j) => {
            const msg = fmtEvent(e, players);
            if (!msg) return null;
            const isLast = lastStr && JSON.stringify(e) === lastStr;
            return (
              <div
                key={j}
                style={{
                  color: EVT_COLOR[e.type] || "#9ca3af",
                  fontWeight: isLast ? "bold" : "normal",
                  background: isLast ? "rgba(255,255,255,0.05)" : "none",
                }}
              >
                {msg}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function VisualizerPanel({ cfg }) {
  const [history, setHistory] = useState(() => [createGame(cfg)]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(150);
  const game = history[history.length - 1];

  useEffect(() => {
    setHistory([createGame(cfg)]);
    setPlaying(false);
  }, [cfg]);
  useEffect(() => {
    if (!playing || game.winner) return;
    const t = setTimeout(
      () => setHistory((h) => [...h, stepGameEvent(h[h.length - 1])]),
      speed,
    );
    return () => clearTimeout(t);
  }, [playing, game.winner, game.tick, game.pendingEvents?.length, speed]);

  const stepFwd = () => {
    setPlaying(false);
    if (!game.winner) setHistory((h) => [...h, stepGameEvent(h[h.length - 1])]);
  };
  const stepBck = () => {
    setPlaying(false);
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  };
  const reset = () => {
    setHistory([createGame(cfg)]);
    setPlaying(false);
  };

  const alive = game.players.filter((p) => p.alive);
  const alienTeam = alive.filter(isAlienTeam).length;
  const humanTeam = alive.filter((p) => !isAlienTeam(p)).length;

  const hl = new Set();
  if (game.lastEvent) {
    const e = game.lastEvent;
    [e.from, e.to, e.victim, e.elimId]
      .filter((x) => x != null)
      .forEach((id) => hl.add(id));
    (e.killers || []).forEach((id) => hl.add(id));
  }

  const statusOf = (p) =>
    p.alive
      ? isAlienTeam(p)
        ? "alive_infected"
        : "alive_healthy"
      : isAlienTeam(p)
        ? "dead_infected"
        : "dead_healthy";
  const ORDER = [
    "alive_healthy",
    "alive_infected",
    "dead_healthy",
    "dead_infected",
  ];
  const sorted = ORDER.flatMap((s) =>
    game.players.filter((p) => statusOf(p) === s),
  );
  const GBG = {
    alive_healthy: "#0d1f0d",
    alive_infected: "#1f0a00",
    dead_healthy: "#141414",
    dead_infected: "#1a0f00",
  };
  const GFG = {
    alive_healthy: "#4ade80",
    alive_infected: "#fb923c",
    dead_healthy: "#6b7280",
    dead_infected: "#b45309",
  };
  const GLBL = {
    alive_healthy: "alive · human",
    alive_infected: "alive · alien",
    dead_healthy: "dead · was human",
    dead_infected: "dead · was alien",
  };
  const SEP = "#374151";
  const CW = 34,
    CH = 30;

  const byRoom = new Map(game.rooms.map((r) => [r.id, []]));
  for (const p of game.players)
    if (p.alive && p.roomId != null && byRoom.has(p.roomId))
      byRoom.get(p.roomId).push(p);
  const activeRoom = game.lastEvent?.roomId ?? null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
        <span className="text-gray-500">tick {game.tick}</span>
        {game.pendingEvents?.length > 0 && (
          <span className="text-gray-600">+{game.pendingEvents.length}</span>
        )}
        <span className="text-red-400">aliens {alienTeam}</span>
        <span className="text-blue-400">humans {humanTeam}</span>
        {game.winner && (
          <span
            className={`font-bold ${game.winner === "aliens" ? "text-red-300" : game.winner === "tie" ? "text-yellow-300" : "text-green-300"}`}
          >
            {game.winner === "tie" ? "→ tie" : `→ ${game.winner} win`}
          </span>
        )}
        <div className="ml-auto">
          <select
            value={speed}
            onChange={(e) => setSpeed(+e.target.value)}
            className="bg-gray-800 text-white rounded px-1 py-0.5 text-xs"
          >
            <option value={1200}>1x</option>
            <option value={500}>2x</option>
            <option value={150}>8x</option>
            <option value={30}>30x</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {game.rooms.map((room) => {
          const ps = byRoom.get(room.id) ?? [];
          const is1v1 = ps.length === 2;
          const isActive = room.id === activeRoom;
          const evtColor = EVT_COLOR[game.lastEvent?.type] || "#6366f1";
          return (
            <div
              key={room.id}
              style={{
                width: 3 * 38 + 2 * 2 + 2 * 6,
                padding: 6,
                flexShrink: 0,
                boxSizing: "border-box",
                boxShadow: isActive ? `0 0 0 1px ${evtColor}` : "none",
              }}
              className={`bg-gray-950 rounded border ${isActive ? "border-transparent" : is1v1 ? "border-indigo-900" : "border-gray-800"}`}
            >
              <div className="text-[8px] tracking-wide uppercase font-mono flex items-center gap-1 mb-1">
                <span className="text-gray-600">{room.name}</span>
                {is1v1 && <span className="text-indigo-700">1v1</span>}
              </div>
              <div style={{ display: "flex", gap: 2, minHeight: 44 }}>
                {ps.map((p) => (
                  <PlayerCard key={p.id} p={p} highlight={hl.has(p.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          overflowX: "auto",
          border: `1px solid ${SEP}`,
          borderRadius: 6,
        }}
      >
        <table
          style={{
            borderCollapse: "collapse",
            tableLayout: "fixed",
            fontSize: 9,
            fontFamily: "monospace",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: "#111827",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <th
                style={{
                  width: 60,
                  textAlign: "right",
                  paddingRight: 6,
                  color: "#374151",
                  fontWeight: "normal",
                  fontSize: 8,
                  position: "sticky",
                  left: 0,
                  backgroundColor: "#111827",
                  zIndex: 11,
                }}
              >
                down / right
              </th>
              {sorted.map((p, ci) => {
                const prev = ci > 0 ? statusOf(sorted[ci - 1]) : null;
                const ui = ROLE_DEFS[p.role]?.ui ?? ROLE_DEFS.human.ui;
                return (
                  <th
                    key={p.id}
                    style={{
                      width: CW,
                      fontWeight: "normal",
                      textAlign: "center",
                      borderLeft:
                        prev && prev !== statusOf(p)
                          ? `2px solid ${SEP}`
                          : "none",
                      paddingBottom: 2,
                      boxShadow: hl.has(p.id)
                        ? `inset 0 -2px 0 ${ui.color}`
                        : "none",
                    }}
                  >
                    <div
                      style={{
                        color: ui.color,
                        opacity: p.alive ? 1 : 0.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ui.letter}
                      {p.name.match(/_(\d+)$/)?.[1] ?? ""}
                    </div>
                    <div
                      style={{
                        color: GFG[statusOf(p)],
                        fontSize: 7,
                        opacity: p.alive ? 1 : 0.6,
                      }}
                    >
                      {!p.alive ? "x" : isAlienTeam(p) ? "inf" : "ok"}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, ri) => {
              const prevRow = ri > 0 ? statusOf(sorted[ri - 1]) : null;
              const groupStart = prevRow !== statusOf(row);
              const rowUi = ROLE_DEFS[row.role]?.ui ?? ROLE_DEFS.human.ui;
              return (
                <React.Fragment key={row.id}>
                  {groupStart && (
                    <tr style={{ backgroundColor: "#111827" }}>
                      <td
                        colSpan={sorted.length + 1}
                        style={{
                          padding: "2px 6px",
                          fontSize: 8,
                          color: GFG[statusOf(row)],
                          borderTop: ri > 0 ? `2px solid ${SEP}` : "none",
                          fontFamily: "monospace",
                        }}
                      >
                        {GLBL[statusOf(row)]}
                      </td>
                    </tr>
                  )}
                  <tr
                    style={{
                      backgroundColor: GBG[statusOf(row)],
                      boxShadow: hl.has(row.id)
                        ? `inset 3px 0 0 ${rowUi.color}`
                        : "none",
                    }}
                  >
                    <td
                      style={{
                        textAlign: "right",
                        paddingRight: 6,
                        whiteSpace: "nowrap",
                        color: rowUi.color,
                        opacity: row.alive ? 1 : 0.5,
                        position: "sticky",
                        left: 0,
                        zIndex: 5,
                        backgroundColor: GBG[statusOf(row)],
                        fontSize: 9,
                      }}
                    >
                      {rowUi.letter}
                      {row.name.match(/_(\d+)$/)?.[1] ?? ""}
                      <span
                        style={{
                          color: GFG[statusOf(row)],
                          marginLeft: 2,
                          fontSize: 7,
                        }}
                      >
                        {!row.alive ? "x" : isAlienTeam(row) ? "inf" : "ok"}
                      </span>
                    </td>
                    {sorted.map((col, ci) => {
                      const prevCol = ci > 0 ? statusOf(sorted[ci - 1]) : null;
                      const bl =
                        prevCol && prevCol !== statusOf(col)
                          ? `2px solid ${SEP}`
                          : "none";
                      if (col.id === row.id)
                        return (
                          <td
                            key={col.id}
                            style={{
                              width: CW,
                              height: CH,
                              borderLeft: bl,
                              textAlign: "center",
                              color: "#374151",
                              verticalAlign: "middle",
                            }}
                          >
                            -
                          </td>
                        );
                      const fb = row.factionBelief[col.id] ?? null;
                      const rb = row.roleBelief[col.id] ?? null;
                      const rc = row.roleConfidence[col.id] ?? 0;
                      const pct = fb !== null ? Math.round(fb * 100) : null;
                      const bg =
                        fb === null
                          ? "transparent"
                          : fb > 0.7
                            ? "#4c1010"
                            : fb > 0.4
                              ? "#4a2200"
                              : fb > 0.1
                                ? "#222"
                                : "transparent";
                      const fg =
                        fb === null
                          ? "#6b7280"
                          : fb > 0.7
                            ? "#fca5a5"
                            : fb > 0.4
                              ? "#fde68a"
                              : fb > 0.1
                                ? "#e5e7eb"
                                : "#9ca3af";
                      return (
                        <td
                          key={col.id}
                          style={{
                            width: CW,
                            height: CH,
                            borderLeft: bl,
                            backgroundColor: bg,
                            textAlign: "center",
                            verticalAlign: "middle",
                            padding: "0 1px",
                          }}
                        >
                          <div
                            style={{ color: fg, lineHeight: 1.2, fontSize: 9 }}
                          >
                            {pct !== null ? `${pct}%` : "."}
                            {rc >= 1 && (
                              <span
                                style={{
                                  color: rb === "alien" ? "#f87171" : "#4ade80",
                                }}
                              >
                                {" "}
                                v
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 7,
                              lineHeight: 1.1,
                              color: rc >= 1 ? "#c4b5fd" : "#9ca3af",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {rb ?? "\u00a0"}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        {[
          { label: "Reset", fn: reset, cls: "bg-gray-700 hover:bg-gray-600" },
          {
            label: "<",
            fn: stepBck,
            cls: "bg-gray-700 hover:bg-gray-600",
            disabled: history.length <= 1,
          },
          {
            label: ">",
            fn: stepFwd,
            cls: "bg-gray-700 hover:bg-gray-600",
            disabled: !!game.winner,
          },
          {
            label: playing ? "Pause" : "Play",
            fn: () => setPlaying((x) => !x),
            cls: playing
              ? "bg-amber-800 hover:bg-amber-700"
              : "bg-green-800 hover:bg-green-700",
            disabled: !!game.winner,
          },
        ].map(({ label, fn, cls, disabled }) => (
          <button
            key={label}
            onClick={fn}
            disabled={disabled}
            className={`px-3 py-1 text-xs text-white rounded ${cls} disabled:opacity-30`}
          >
            {label}
          </button>
        ))}
      </div>

      <EventLog
        log={game.log}
        lastEvent={game.lastEvent}
        players={game.players}
      />
    </div>
  );
}

function ConfigPanel({ cfg, onChange }) {
  const set = (k, v) => {
    v = +v;
    const next = { ...cfg, [k]: v };
    if (k !== "nPlayers" && k !== "nRooms") {
      const minP =
        next.nAliens +
        next.nDoctors +
        next.nDuelists +
        next.nImmune +
        next.nEmpaths +
        next.nPredisposed +
        1;
      if (next.nPlayers <= minP) next.nPlayers = minP + 1;
    }
    next.nRooms = Math.max(next.nRooms, Math.ceil(next.nPlayers / 3));
    onChange(next);
  };
  const nHumans =
    cfg.nPlayers -
    cfg.nAliens -
    cfg.nDoctors -
    (cfg.nDuelists || 0) -
    (cfg.nImmune || 0) -
    (cfg.nEmpaths || 0) -
    (cfg.nPredisposed || 0);
  const minRooms = Math.ceil(cfg.nPlayers / 3);
  const threshSteps = [0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
  const threshLabel = { 0.3: "trigger-happy", 0.5: "normal", 0.8: "cautious" };
  const fields = [
    { label: "Total players", k: "nPlayers", min: 4, max: 20 },
    { label: `Rooms (min ${minRooms})`, k: "nRooms", min: minRooms, max: 12 },
    { label: "Aliens", k: "nAliens", min: 0, max: 6 },
    { label: "Doctors", k: "nDoctors", min: 0, max: 6 },
    { label: "Duelists", k: "nDuelists", min: 0, max: 4 },
    { label: "Immune", k: "nImmune", min: 0, max: 4 },
    { label: "Empaths", k: "nEmpaths", min: 0, max: 4 },
    { label: "Predisposed", k: "nPredisposed", min: 0, max: 4 },
  ];
  const roleDesc = {
    alien: "alien · infects in 1v1",
    doctor: "doctor · heals in 1v1 · learns infector",
    human: "crew · gossips · calls votes",
    duelist: "duelist · 1 kill when belief >55%",
    immune: "immune · blocks infection silently",
    empath: "empath · forces role reveal · if infected leaks to aliens",
    predisposed: "predisposed · always alien-team · lies once to doctor",
  };
  return (
    <div className="space-y-4">
      {fields.map(({ label, k, min, max }) => (
        <div key={k} className="flex items-center gap-3">
          <span className="text-gray-400 text-xs w-36 shrink-0">{label}</span>
          <input
            type="range"
            min={min}
            max={max}
            value={cfg[k] ?? min}
            onChange={(e) => set(k, e.target.value)}
            className="flex-1 accent-indigo-500"
          />
          <span className="w-5 text-right text-white font-mono text-sm">
            {cfg[k]}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-xs w-36 shrink-0">
          Vote aggressiveness
        </span>
        <input
          type="range"
          min={0}
          max={threshSteps.length - 1}
          value={threshSteps.indexOf(cfg.voteThreshold ?? 0.7)}
          onChange={(e) =>
            onChange({ ...cfg, voteThreshold: threshSteps[+e.target.value] })
          }
          className="flex-1 accent-indigo-500"
        />
        <span className="w-24 text-right text-white font-mono text-xs">
          {threshLabel[cfg.voteThreshold] ?? cfg.voteThreshold}
        </span>
      </div>
      <p className="text-xs text-gray-500">
        {Math.max(0, nHumans)} plain crew · max 3/room · reveals in 1v1 only
      </p>
      <div className="text-xs text-gray-600 space-y-1 border-t border-gray-800 pt-3">
        {Object.entries(ROLE_DEFS).map(([role, def]) => (
          <p key={role}>
            <span style={{ color: def.ui.color }} className="font-bold">
              {def.ui.letter}
            </span>{" "}
            {roleDesc[role]}
          </p>
        ))}
        <p className="text-gray-700 mt-1">
          3-person rooms: gossip only · alien-team gossip lies
        </p>
      </div>
      <div className="border-t border-gray-800 pt-3 space-y-2">
        <div className="flex gap-2 items-center">
          <span className="text-gray-500 text-xs">Config JSON</span>
          <button
            onClick={() => {
              try {
                onChange({
                  ...DEFAULT_CFG,
                  ...JSON.parse(document.getElementById("cfg-json").value),
                });
              } catch {}
            }}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
          >
            Apply
          </button>
        </div>
        <textarea
          id="cfg-json"
          key={JSON.stringify(cfg)}
          defaultValue={JSON.stringify(cfg)}
          className="w-full bg-gray-800 text-gray-300 text-[10px] font-mono rounded p-1.5 border border-gray-700 resize-none"
          rows={3}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function MonteCarloPanel({ cfg }) {
  const [n, setN] = useState(500);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);
  const run = useCallback(() => {
    setRunning(true);
    setResults(null);
    setTimeout(() => {
      setResults(runMonteCarlo(cfg, n));
      setRunning(false);
    }, 20);
  }, [cfg, n]);
  const pct = (v) =>
    results ? ((v / results.total) * 100).toFixed(1) + "%" : "—";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm">Runs</span>
        <select
          value={n}
          onChange={(e) => setN(+e.target.value)}
          className="bg-gray-800 text-white text-sm rounded px-2 py-1"
        >
          {[100, 500, 1000, 5000].map((v) => (
            <option key={v} value={v}>
              {v.toLocaleString()}
            </option>
          ))}
        </select>
        <button
          onClick={run}
          disabled={running}
          className="px-4 py-1 bg-indigo-700 hover:bg-indigo-600 disabled:opacity-40 rounded text-white text-sm"
        >
          {running ? "Running..." : "Run"}
        </button>
      </div>
      {results && (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            {[
              { label: "Human wins", v: results.humanWins, color: "#3b82f6" },
              { label: "Alien wins", v: results.alienWins, color: "#ef4444" },
              { label: "Ties", v: results.ties, color: "#facc15" },
              { label: "Timeout", v: results.timeouts, color: "#6b7280" },
            ].map(({ label, v, color }) => (
              <div key={label} className="bg-gray-800 rounded-lg p-3">
                <div className="text-xl font-bold" style={{ color }}>
                  {pct(v)}
                </div>
                <div className="text-gray-400 text-xs">{label}</div>
                <div className="text-gray-600 text-[10px]">
                  {v}/{results.total}
                </div>
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm">
            Avg:{" "}
            <span className="text-white font-mono">
              {results.avgTicks.toFixed(1)}
            </span>{" "}
            ticks
          </p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart
              data={[
                { name: "Humans", w: results.humanWins },
                { name: "Aliens", w: results.alienWins },
                { name: "Ties", w: results.ties },
                { name: "T/O", w: results.timeouts },
              ].filter((d) => d.w > 0)}
              margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  color: "#fff",
                }}
              />
              <Bar dataKey="w" fill="#6366f1" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart
              data={results.distArr}
              margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="tick" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
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

function App() {
  const [tab, setTab] = useState("visualize");
  const [cfg, setCfgRaw] = useState(DEFAULT_CFG);

  useEffect(() => {
    try {
      const v = localStorage.getItem("sporz:cfg");
      if (v) setCfgRaw({ ...DEFAULT_CFG, ...JSON.parse(v) });
    } catch {}
  }, []);

  const setCfg = useCallback((next) => {
    setCfgRaw(next);
    try {
      localStorage.setItem("sporz:cfg", JSON.stringify(next));
    } catch {}
  }, []);

  const subtitle =
    `${cfg.nPlayers}p · ${cfg.nRooms}r · ${cfg.nAliens}A · ${cfg.nDoctors}D` +
    `${cfg.nDuelists ? ` · ${cfg.nDuelists}U` : ""}${cfg.nImmune ? ` · ${cfg.nImmune}I` : ""}` +
    `${cfg.nEmpaths ? ` · ${cfg.nEmpaths}E` : ""}${cfg.nPredisposed ? ` · ${cfg.nPredisposed}P` : ""}`;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 font-sans max-w-xl mx-auto">
      <div className="mb-4">
        <h1 className="text-base font-bold tracking-tight">Sporz Simulator</h1>
        <p className="text-gray-600 text-xs font-mono mt-0.5">{subtitle}</p>
      </div>
      <div className="flex gap-1 mb-3 bg-gray-900 p-1 rounded-lg">
        {[
          { id: "config", label: "Config" },
          { id: "visualize", label: "Visualize" },
          { id: "montecarlo", label: "Monte Carlo" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-1 text-xs rounded transition-colors ${tab === t.id ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-gray-900 rounded-xl p-4">
        {tab === "config" && <ConfigPanel cfg={cfg} onChange={setCfg} />}
        {tab === "visualize" && <VisualizerPanel cfg={cfg} />}
        {tab === "montecarlo" && <MonteCarloPanel cfg={cfg} />}
      </div>
    </div>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
