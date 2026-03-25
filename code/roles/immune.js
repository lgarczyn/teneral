class ImmuneRole {
  constructor() {
    this.prefix = "Imm";
    this.startInfected = false;
    this.ui = { letter: "I", color: "#22d3ee", border: "border-cyan-500" };
  }

  gossip(speaker, listener) {
    honestGossip(speaker, listener);
  }

  movementScore() {
    return 0;
  }
}

ROLE_DEFS.immune = new ImmuneRole();
