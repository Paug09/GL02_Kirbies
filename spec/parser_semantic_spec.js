const Time_Slot = require('../Objet.js');

describe("Time_Slot Class Testing", function() {
    
    beforeAll(function() {
        // Initialiser une instance de Time_Slot
        this.t = new Time_Slot(1, "C1", 20, "L 10:00-12:00", "F1", "S204");
    });

    it("should create a Time_Slot instance", function() {
        expect(this.t).toBeDefined();
    });

    it("should correctly assign the 'id' property", function() {
        expect(this.t.id).toBe(1);
    });

    it("should correctly assign the 'type' property", function() {
        expect(this.t.type).toBe("C1");
    });

    it("should correctly assign the 'capacite' property", function() {
        expect(this.t.capacite).toBe(20);
    });

    it("should correctly assign the 'heure' property", function() {
        expect(this.t.horaire).toBe("L 10:00-12:00");
    });

    it("should correctly assign the 'groupe' property", function() {
        expect(this.t.groupe).toBe("F1");
    });

    it("should correctly assign the 'salle' property", function() {
        expect(this.t.salle).toBe("S204");
    });

    it("should match the expected object structure", function() {
        expect(this.t).toEqual(jasmine.objectContaining({
            id: 1,
            type: "C1",
            capacite: 20,
            horaire: "L 10:00-12:00",
            groupe: "F1",
            salle: "S204"
        }));
    });

    it("should correctly convert to string", function() {
        const expectedString = "ID: 1, Type: C1, Capacité: 20, Horaire: L 10:00-12:00, Groupe: F1, Salle: S204";
        expect(this.t.toString()).toBe(expectedString);
    });
});
