class EmpathRole {
  constructor() {
    this.prefix = "Emp";
    this.startInfected = false;
    this.ui = { letter: "E", color: "#a78bfa", border: "border-violet-500" };
  }

  gossip(speaker, listener) {
    honestGossip(speaker, listener);
  }

  movementScore() {
    return 0;
  }

  scan(self, other, allPlayers) {
    self.roleBelief[other.id] = other.role;
    self.roleConfidence[other.id] = 1.0;
    setRole(other, self.id, "empath", 1.0);
    self.factionBelief[other.id] =
      other.role === "alien" || other.role === "predisposed"
        ? 1
        : Math.min(self.factionBelief[other.id] ?? 1, 0.1);

    // Infected empath leaks info to alien team
    if (isAlienTeam(self)) {
      for (const p of allPlayers) {
        if (p.alive && isAlienTeam(p) && p.id !== self.id) {
          setRole(p, other.id, other.role, self.roleConfidence[other.id] ?? 0);
          p.factionBelief[other.id] = self.factionBelief[other.id] ?? 0;
        }
      }
    }

    return [
      {
        type: "empath_scan",
        from: self.id,
        to: other.id,
        revealed: other.role,
        fromInfected: isAlienTeam(self),
        toInfected: isAlienTeam(other),
      },
    ];
  }
}

ROLE_DEFS.empath = new EmpathRole();
