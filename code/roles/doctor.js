class DoctorRole {
  constructor() {
    this.prefix = "Doc";
    this.startInfected = false;
    this.ui = { letter: "D", color: "#3b82f6", border: "border-blue-500" };
    this.revealPriority = 1;
  }

  gossip(speaker, listener) {
    honestGossip(speaker, listener);
  }

  movementScore(p, occ) {
    let b = 0;
    for (const id of occ) {
      const fb = p.factionBelief[id] ?? 0;
      const ca =
        p.roleBelief[id] === "alien" && (p.roleConfidence[id] ?? 0) >= 1;
      if (fb > 0.4 && !ca) b += fb;
    }
    return b;
  }

  reveal(self, other, all) {
    if (self.infected || !other.alive || !other.infected) return null;
    other.factionBelief[self.id] = 0;
    setRole(other, self.id, "doctor", 1.0);
    if (other.role === "predisposed") {
      return this._healPredisposed(self, other, all);
    }
    const infector = other.infectedBy;
    other.infected = false;
    other.infectedBy = null;
    self.factionBelief[other.id] = 0;
    if (infector != null) {
      self.factionBelief[infector] = 1;
      setRole(self, infector, "alien", 1.0);
      other.factionBelief[infector] = 1;
      setRole(other, infector, "alien", 1.0);
    }
    return [
      {
        type: "heal",
        from: self.id,
        to: other.id,
        fromInfected: false,
        toInfected: false,
      },
    ];
  }

  _healPredisposed(doc, pat, all) {
    if (!pat.lieUsed) {
      const pool = all.filter(
        (p) => p.alive && p.id !== doc.id && p.id !== pat.id && !isAlienTeam(p),
      );
      if (pool.length) {
        pat.lieUsed = true;
        const sc = pool[Math.floor(Math.random() * pool.length)];
        doc.factionBelief[sc.id] = Math.min(
          1,
          (doc.factionBelief[sc.id] || 0) + 0.6,
        );
        doc.factionBelief[pat.id] = 0;
        return [
          {
            type: "false_heal",
            from: doc.id,
            to: pat.id,
            framed: sc.id,
            fromInfected: false,
            toInfected: true,
          },
        ];
      }
    }
    doc.factionBelief[pat.id] = Math.min(
      1,
      (doc.factionBelief[pat.id] || 0) + 0.5,
    );
    return [
      {
        type: "false_heal",
        from: doc.id,
        to: pat.id,
        framed: null,
        fromInfected: false,
        toInfected: true,
      },
    ];
  }
}

ROLE_DEFS.doctor = new DoctorRole();
