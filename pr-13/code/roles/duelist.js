ROLE_DEFS.duelist = {
  prefix: "Duel",
  ui: { letter: "U", color: "#f59e0b", border: "border-amber-500" },
  gossip: honestGossip,
  revealPriority: 2,
  initPlayer(player) {
    player.killUsed = false;
  },
  reveal(self, other) {
    if (self.infected || self.killUsed || !other.alive) return null;
    if ((self.factionBelief[other.id] || 0) > 0.55) {
      self.killUsed = true;
      other.alive = false;
      return [
        {
          type: "kill",
          from: self.id,
          to: other.id,
          fromInfected: self.infected,
          toInfected: other.infected,
        },
      ];
    }
    return null;
  },
};
