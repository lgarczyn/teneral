class HumanRole {
  constructor() {
    this.prefix = "Crew";
    this.startInfected = false;
    this.ui = { letter: "H", color: "#6b7280", border: "border-gray-600" };
  }

  gossip(speaker, listener) {
    honestGossip(speaker, listener);
  }

  movementScore() {
    return 0;
  }
}

ROLE_DEFS.human = new HumanRole();
