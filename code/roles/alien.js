ROLE_DEFS.alien = {
  prefix: "Alien",
  ui: { letter: "A", color: "#ef4444", border: "border-red-600" },
  gossip: adversarialGossip,
  revealPriority: 0,
  movementScore(p, occ) {
    const c = occ.filter((id) => (p.factionBelief[id] || 0) < 0.3);
    return occ.length === 1 && c.length === 1 ? 1 : 0;
  },
  reveal(self, other, all) {
    if (
      !other.alive ||
      other.infected ||
      other.role === "alien" ||
      other.role === "predisposed"
    )
      return null;
    if (other.role === "immune") {
      self.factionBelief[other.id] = 1;
      other.factionBelief[self.id] = 1;
      setRole(other, self.id, "alien", 1.0);
      return [{ type: "infect_immune", from: self.id, to: other.id }];
    }
    other.infected = true;
    other.infectedBy = self.id;
    other.factionBelief[self.id] = 1;
    setRole(other, self.id, "alien", 1.0);
    self.factionBelief[other.id] = 1;
    return [
      {
        type: "infect",
        from: self.id,
        to: other.id,
        fromInfected: false,
        toInfected: true,
      },
    ];
  },
};
