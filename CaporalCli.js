const fs = require('fs');
const colors = require('colors');
const CruParser = require('./CruParser.js');

const vg = require('vega');
const vegalite = require('vega-lite');

const cli = require("@caporal/core").default;

cli
	.version('cru-parser-cli')
	.version('0.01')
	// check Cru
	.command('check', 'Check if <file> is a valid Cru file')
	.argument('<file>', 'The file to check with Cru parser')
	.option('-s, --showSymbols', 'log the analyzed symbol at each step', { validator: cli.BOOLEAN, default: false })
	.option('-t, --showTokenize', 'log the tokenization results', { validator: cli.BOOLEAN, default: false })
	.option('-d, --showDebug', 'log the debug information', { validator: cli.BOOLEAN, default: false })
	.action(({ args, options, logger }) => {

		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			var analyzer = new CruParser(options.showTokenize, options.showSymbols, options.showDebug);
			analyzer.parse(data);

			if (analyzer.errorCount === 0) {
				logger.info("The .cru file is a valid cru file".green);
			} else {
				logger.info("The .cru file contains error".red);
				//Donne le nombre d'erreurs
				logger.info("Error count : %d", analyzer.errorCount);
			}
			analyzer.ParsedCourse.forEach(course => {
				console.log(`Course Code: ${course.courseCode}`);
				course.timeSlots.forEach((ts, index) => {
					console.log(`- Time Slot ${index + 1}: ${ts.toString()}`);
				});
			});
			logger.debug(analyzer.parsedCourse);

		});

	})

	//readme
	.command('readme', 'Display the README.txt file')
	.action(({ logger }) => {
		fs.readFile("./README.txt", 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}
			logger.info(data);
		});
	})

	// search rooms with a given course
	.command('courseRoom', 'Looks for the rooms associated with a course')
	.argument('<file>', 'The Cru file to search')
	.argument('<course>', 'The course you want to search')
	.option('-c, --capacity', 'Shows capacity of the room(s)', { validator: cli.BOOLEAN, default: false })
	.action(({ args, options, logger }) => {
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			const analyzer = new CruParser();
			analyzer.parse(data);

			//if (analyzer.errorCount === 0) {
			// find the given course in the database
			const courseToSearch = analyzer.ParsedCourse.find(course => course.courseCode === args.course);

			// if the course is found
			if (courseToSearch) {
				console.log(`Rooms that welcome the course ${courseToSearch.courseCode}:`);

				courseToSearch.timeSlots.forEach((ts) => {
					console.log(`- ${ts.salle}`);

					if (options.capacity) {
						const capacity = parseInt(ts.capacite);
						console.log(`  Capacity: ${capacity}`);
					}
				});
			} else {
				logger.warn("No rooms found for the given course.");
			}
			//} else {
			//	logger.warn("The .cru file contains parsing errors.");
			//}
		});
	})

	//search room with a given time slot
	.command('RoomsForSlot', 'Looks for the rooms available at a given time slot')
	.argument('<file>', 'The Cru file to search')
	.argument('<day>', 'The day you want to know the available rooms (L, MA, ME, J, V, or S)')
	.argument('<timeSlot>', 'The time slot you want to search (e.g., 14:00-16:00)')
	.action(({ args, logger }) => {
		// Lire le fichier .cru
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			const analyzer = new CruParser();
			analyzer.parse(data);

			//if (analyzer.errorCount === 0) {
			// Fonction pour extraire toutes les salles uniques du fichier
			function extractRooms(data) {
				const roomPattern = /S=([A-Za-z0-9]+)/g;
				const rooms = [];
				let match;

				while ((match = roomPattern.exec(data)) !== null) {
					rooms.push(match[1]);
				}

				return rooms.filter((value, index, self) => self.indexOf(value) === index); // Supprime les doublons
			}

			// Extraire les salles uniques
			const allRooms = extractRooms(data);

			// Trouver les salles occupées
			const occupiedRooms = [];
			const dayMapping = {"L": 1, "MA": 2, "ME": 3, "J": 4, "V": 5, "S": 6};

			analyzer.ParsedCourse.forEach(course => {
				course.timeSlots.forEach(slot => {
					const dayOfWeek = dayMapping[slot.heure.split(" ")[0]]; // Récupère le jour
					const timeRange = slot.heure.split(" ")[1]; // Récupère "08:00-10:00"
					// Vérifier si le jour et le créneau correspondent
					if (dayOfWeek === args.day && timeRange === args.timeSlot) {
						occupiedRooms.push(slot.salle);
						console.log(`Salle occupée : ${slot.salle}`)
					}
				});
			});

			// Calculer les salles disponibles
			const availableRooms = allRooms.filter(room => !occupiedRooms.includes(room));

			if (availableRooms.length > 0) {
				logger.info(`Rooms available on ${args.day} during the time slot ${args.timeSlot}:`);
				availableRooms.forEach(room => logger.info(`- ${room}`));
			} else {
				logger.warn(`No rooms available on ${args.day} during the time slot ${args.timeSlot}.`);
			}
			/*} else {
				logger.info("The .cru file contains errors.".red);
			}*/
		});
	});






/*
	//average
	.command('average', 'Compute the average note of each POI')
	.alias('avg')
	.argument('<file>', 'The Vpf file is to use')

	// abc

	// average with chart
	.command('averageChart', 'Compute the average note of each POI and export a Vega-lite chart')
	.alias('avgChart')
	.argument('<file>', 'The Vpf file to use')
	.action(({ args, options, logger }) => {
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			analyzer = new VpfParser();
			analyzer.parse(data);

			if (analyzer.errorCount === 0) {

				// ToDo: Prepare the data for avg //
				// let avg = <un array de POI ayant un attribut "averageRatings" égal à la moyenne des notes qu'il a reçu>

				var avgChart = {
					//"width": 320,
					//"height": 460,
					"data": {
						"values": avg
					},
					"mark": "bar",
					"encoding": {
						"x": {
							"field": "name", "type": "nominal",
							"axis": { "title": "Restaurants' name." }
						},
						"y": {
							"field": "averageRatings", "type": "quantitative",
							"axis": { "title": "Average ratings for " + args.file + "." }
						}
					}
				}



				const myChart = vegalite.compile(avgChart).spec;

				/* SVG version 
				var runtime = vg.parse(myChart);
				var view = new vg.View(runtime).renderer('svg').run();
				var mySvg = view.toSVG();
				mySvg.then(function (res) {
					fs.writeFileSync("./result.svg", res)
					view.finalize();
					logger.info("%s", JSON.stringify(myChart, null, 2));
					logger.info("Chart output : ./result.svg");
				});

				/* Canvas version */
/*
var runtime = vg.parse(myChart);
var view = new vg.View(runtime).renderer('canvas').background("#FFF").run();
var myCanvas = view.toCanvas();
myCanvas.then(function(res){
	fs.writeFileSync("./result.png", res.toBuffer());
	view.finalize();
	logger.info(myChart);
	logger.info("Chart output : ./result.png");
})			
	


} else {
logger.info("The .vpf file contains error".red);
}

});
}) */



cli.run(process.argv.slice(2));
