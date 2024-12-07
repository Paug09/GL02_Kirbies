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

	// search when a room is free
	.command('whenFreeRoom', 'Check when a certain room is free during the week')
	.argument('<file>', 'The Cru file to search')
	.argument('<room>', 'The room you want to search if it is free')
	.action(({ args, logger }) => {
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			const analyzer = new CruParser();
			analyzer.parse(data);

			//if (analyzer.errorCount === 0) {
			// find the given room in the database
			const roomToSearch = analyzer.ParsedCourse.find(room => room.timeSlots === args.room);


			// if the room is found
			if (roomToSearch) {
				// Trouver les moments où est occupée la salle
				const occupiedSlots = [];
				const dayMapping = { "L": 1, "MA": 2, "ME": 3, "J": 4, "V": 5, "S": 6 };

				room.timeSlots.forEach(slot => {
					const dayOfWeek = dayMapping[slot.heure.split(" ")[0]]; // Récupère le jour
					const timeRange = slot.heure.split(" ")[1]; // Récupère "08:00-10:00"
					occupiedSlots.push(slot.salle); //Ajoute le crénaux au tableau des crénaux occupés
					console.log(`La salle est occupée durant le crénau suivant: ${slot.horaire}`);
				});

				// Calculer les moments où la salle est disponible
				const availabilityRoom = allFreeMoment.filter(slot => !occupiedSlots.includes(slot));

				if (availabilityRoom.length > 0) {
					logger.info(`The room ${args.room} is available on the following slots:`);
					availabilityRoom.forEach(slot => logger.info(`- ${slot}`));
				} else {
					logger.warn(`The room ${args.room} does not have any available slots.`);
				}
			} else {
				logger.warn("No rooms found for the given name.");
			}

			//} else {
			//	logger.warn("The .cru file contains parsing errors.");
			//}
		});
	});

/*
	// search
	.command('search', 'Free text search on POIs\' name')
	.argument('<file>', 'The Vpf file to search')
	.argument('<needle>', 'The text to look for in POI\'s names')
	.action(({ args, options, logger }) => {
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			analyzer = new VpfParser();
			analyzer.parse(data);

			if (analyzer.errorCount === 0) {

				let poiAFiltrer = analyzer.parsedPOI.filter(poi=>poi.name.includes(args.needle));
				logger.info("%s", JSON.stringify(poiAFiltrer, null, 2));

			} else {
				logger.info("The .vpf file contains error".red);
			}

		});
	})

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
