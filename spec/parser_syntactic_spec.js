describe("Program Syntactic testing of CruParser - time_slot", function() {

    beforeAll(function() {
        // Importer les dépendances nécessaires
        const Time_Slot = require('../Objet.js');
        const CruParser = require('../CruParser.js');

        // Initialiser les instances nécessaires
        this.analyzer = new CruParser();
    });

    it("can parse a single time_slot from a simulated input", function() {
        // Simuler une entrée pour un time_slot
        let input = ["1", "C1", "P", "20", "H", "L", "10:00", "-", "12:00", "F1", "S", "S204", "//"];

        // Appeler la méthode time_slot
        let result = this.analyzer.time_slot(input);

        // Vérifier que le time_slot est correctement analysé
        expect(result).toEqual({
            id: "1",
            type: "C1",
            capacite: "20",
            horaire: "L 10:00-12:00",
            groupe: "F1",
            salle: "S204"
        });
    });

    it("throws an error for invalid time_slot input", function() {
        // Simuler une entrée invalide (manque de données)
        let input = ["1", "C1", "P", "20", "H", "L", "10:00", "-", "12:00", "F1", "S"];

        // Vérifier que l'analyse lève une erreur
        expect(() => this.analyzer.time_slot(input)).toThrow();
    });

});
