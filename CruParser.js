var Slot = require('./Objet.js');
// C'est pas ça plutôt ? :
//var Time_Slot = require('./Objet.js');
var Course = require('./Objet.js');

var CruParser = function (sTokenize, sParsedSymb) {
    this.ParsedCourse = [];
    this.symb = ["+", ",", ",P=", ",H=", ",F", ",S=", "//"];
    this.showTokenize = sTokenize;
    this.showParsedSymbol = sParsedSymb;
}

//Parser procedure 
// tokenize : transform the data input into a list

CruParser.prototype.tokenize = function (data) {
    var separator = /(\r\n)/;
    data = data.split(separator);
    data = data.filter((val, idx) => !val.match(separator));
    return data;
}

// parse : analyze data by calling the first non terminal rule of the grammar
CruParser.prototype.parse = function (data) {
    var tData = this.tokenize(data);
    if (this.showTokenize) {
        console.log(tData);
    }
    this.time_slot(tData);
}

// expect : expect the next symbol to be s.
CruParser.prototype.expect = function (s, input) {
    if (s == this.next(input)) {
        //console.log("Reckognized! "+s)
        return true;
    } else {
        this.errMsg("symbol " + s + " doesn't match", input);
    }
    return false;
}

// Parser rules 
// <course-def> = "+" <course-code> CRLF *(<time-slot>)
CruParser.prototype.course_def = function (input) {
    this.expect("+", input);
    this.course_code(input);
    this.time_slot(input);
}

// <course-code> = 2ALPHA 2DIGIT
CruParser.prototype.course_code = function (input) {
    this.expect(/[A-Z]{2}\d{2}/, input);
}

// <time-slot> = <slot-id> "," <type> "," <capacity> "," <time> "," <group-id> "," <room> "//" CRLF
CruParser.prototype.time_slot = function (input) {
    var id = this.slot_id(input);
    this.expect(",", input);

    var type = this.type(input);

    this.expect(",P=", input);
    var capacity = this.capacity(input);

    this.expect(",H=", input);
    var schedule = this.schedule(input);

    this.expect(",F", input);
    var group = this.group_id(input);

    this.expect(",S=", input);
    var room = this.room(input);

    this.expect("//", input);
}

// <slot-id> = *DIGIT
CruParser.prototype.slot_id = function (input) {
    this.expect(/\d+/, input);
}

// <type> = ALPHA 1-2DIGIT
CruParser.prototype.type = function (input) {
    this.expect(/[A-Z]\d{1-2}/, input);
}

//<capacity> = 1-3DIGIT
CruParser.prototype.capacity = function (input) {
    this.expect(/\d{1-3}/, input);
}

// time = "H=" day WSP time-range
//<time> = day WSP <time-range>
CruParser.prototype.schedule = function (input) {
    this.day(input);
    this.expect(/[A-Z]+/, input);
    this.time_range(input);
}

//<day> = 1-2ALPHA
CruParser.prototype.day = function (input) {
    this.expect(/(L|MA|ME|J|V|S)/, input);
}

//<time-range> = <time-start> "-" <time-end>
CruParser.prototype.time_range = function (input) {
    this.time_start(input);
    this.expect("-", input);
    this.time_end(input);
}

//<time-start> = 1-2DIGIT ":" 2DIGIT
CruParser.prototype.time_start = function (input) {
    this.expect(/([8-9]|1[0-9]|20):[0-5][0-9]/, input);
}

//<time-end> = 1-2DIGIT ":"2DIGIT
CruParser.prototype.time_end = function (input) {
    this.expect(/([9]|1[0-9]|2[0-2]):[0-5][0-9]/, input);
}

// Proposition, je ne sais même pas si ça fonctionne/que ça s'écrive comme ça
/*
//<time-start> = <time>
CruParser.prototype.time_start = time;
}

//<time-end> = 
CruParser.prototype.time_end = time;
}

//<time> = 1-2DIGIT ":"2DIGIT
CruParser.prototype.time = function (input) {
    this.expect(/([9]|1[0-9]|2[0-2]):[0-5][0-9]/, input);
}
*/

//<groupe-id> = 1(DIGIT / ALPHA)
CruParser.prototype.group_id = function (input) {
    this.expect(/[A-Z]|\d{1}/, input);
}

// room = "S=" room-code
// room-code = (1ALPHA 3DIGIT)/(3ALPHA 1DIGIT)
//<room> = (1ALPHA 3DIGIT) / (3ALPHA 1DIGIT)
CruParser.prototype.room = function (input) {
    this.expect(/([A-Z]\d{3})|([A-Z]{3}\d)/, input);
}
