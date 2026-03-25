class DuelistRole {
  constructor() {
    this.prefix = "Duel";
    this.startInfected = false;
    this.ui = { letter: "U", color: "#f59e0b", border: "border-amber-500" };
    this.revealPriority = 2;
  }

  gossip(speaker, listener) {
    honestGossip(speaker, listener);
  }

  movementScore() {
    return 0;
  }

  initPlayer(player) {
    player.killUsed = false;
  }

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
  }
}

ROLE_DEFS.duelist = new DuelistRole();
