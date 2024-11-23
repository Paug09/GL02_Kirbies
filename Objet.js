var Time_Slot = function(I,T,P,H,G,S) {
    this.id = I;   
    this.type = T;
    this.capacite = P;
    this.heure = H;
    this.groupe = G;
    this.salle = S;
}
module.exports = Slot;
// A voir si le course est vraiment utile ou non ( spoiler non ) 
var Course = function(C,Slot) {
    this.cours = C;
    this.slot = [].concat(Slot);
}
module.exports = Course;