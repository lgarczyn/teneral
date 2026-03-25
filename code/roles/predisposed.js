class PredisposedRole {
  constructor() {
    this.prefix = "Pre";
    this.startInfected = true;
    this.ui = { letter: "P", color: "#f97316", border: "border-orange-500" };
  }

  gossip(speaker, listener, all) {
    adversarialGossip(speaker, listener, all);
  }

  movementScore() {
    return 0;
  }
}

ROLE_DEFS.predisposed = new PredisposedRole();
