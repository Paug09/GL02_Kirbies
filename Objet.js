// Constructeur de time-slot
// Slot = (C, T, P, H, G, S)
var Time_Slot = function (I, T, P, H, G, S) {
    // C : Course code
    this.id = I;
    // T : Type
    this.type = T;
    // P : Capacity (max number of students)
    this.capacite = P;
    // H : Schedule
    this.heure = H;
    // G : Subgroup
    this.groupe = G;
    // S : Associated room
    this.salle = S;
}
module.exports = Slot;
// C'est pas ça plutôt ? :
//module.exports = Time_Slot;

// A voir si le course est vraiment utile ou non ( spoiler non ) 
// Constructeur de Course
var Course = function (C, Slot) {
    this.cours = C;
    // Donne la liste des time-slot liés à ce cours
    // SC = {S1, S2, …, Sn}
    this.slot = [].concat(Slot);
}
module.exports = Course;