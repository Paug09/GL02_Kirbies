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

	// Identify which rooms are under-utilized or over-utilized
	// And, in option, the capacity to generate a synthetic visualization of room occupancy rates and rank by seating capacity.
	.command('utilizedRoom', 'Show the utilized purcentage')
	.argument('<file>', 'The Cru file to search')
	.option('-v, --view', 'Shows a graphic representation of the occupancy of the room', { validator: cli.BOOLEAN, default: false }) // Option pour afficher la représentation graphique
	.action(({ args, option, logger }) => {
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			const analyzer = new CruParser();
			analyzer.parse(data);

			//if (analyzer.errorCount === 0) {
			
			// Split a time range, on the same day, into slots of 30 minutes
			function splitInto30MinuteSlots(day, timeRange) {
				const [start, end] = timeRange.split('-');
				const startHour = parseInt(start.split(':')[0]);
				const startMinute = parseInt(start.split(':')[1]);
				const endHour = parseInt(end.split(':')[0]);
				const endMinute = parseInt(end.split(':')[1]);

				const slots = [];
				let currentHour = startHour;
				let currentMinute = startMinute;

				while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
					const nextMinute = (currentMinute + 30) % 60;
					const nextHour = currentHour + Math.floor((currentMinute + 30) / 60);

					const slotStart = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
					const slotEnd = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
					slots.push(`${day} ${slotStart} - ${slotEnd}`);

					currentHour = nextHour;
					currentMinute = nextMinute;
				}

				return slots;
			}

			// Find the occupied slots
			const getOccupiedSlots = (parsedCourse, room) => {
				const occupiedSlots = [];
				parsedCourse.forEach(course => {
					// Check if the room is occupied
					course.timeSlots.forEach(slot => {
						if (slot.salle === room) {
							occupiedSlots.push(...splitInto30MinuteSlots(slot.horaire.split(' ')[0], slot.horaire.split(' ')[1]));
						}
					});
				});
				return occupiedSlots;
			};

			// First step : Retrieve occupied slots for each room
			const roomOccupancyData = [];
			analyzer.ParsedCourse.forEach(course => {
				course.timeSlots.forEach(slot => {
					const room = slot.salle;
					const occupiedSlots = getOccupiedSlots(analyzer.ParsedCourse, room);
					const totalSlots = 28 * 6 - 20; // Example: 28 30-minute slots per week (8am to 10pm)
					let occupiedCount = occupiedSlots.length;
					console.log(`OccupiedCount = ${occupiedCount}`)
					if (!roomOccupancyData.some(roomData => roomData.room === room)) {
						roomOccupancyData.push({
							room,
							occupiedCount,
							totalSlots,
							capacity: slot.capacite // If available in .cru file
						});
					}

				});
			});

			// Iteration on 'rooms' object keys
			roomOccupancyData.forEach(data => {
				// Retrieve room occupancy percentage in 'rooms
				const occupencyPercentage = ((data.occupiedCount/data.totalSlots)*100).toFixed(2);

				// Retrieve room capacity in 'capacity'.
				const roomCapacity = data.capacity;

				// Display the occupancy percentage and capacity of each room
				console.log(`Room: ${data.room}`);
				console.log(`  Occupancy Percentage: ${occupencyPercentage}%`);
				console.log(`  Capacity: ${roomCapacity}`);
				if (occupencyPercentage <= 50){
					console.log(`This room is under-utilized`);
				}else if (occupencyPercentage < 80 && occupencyPercentage > 50){
					console.log(`This room is normal utilized`);
				}else{
					console.log(`This room is over-utilized`);
				}
				console.log('----------------------------');
			});

			//} else {
			//	logger.warn("The .cru file contains parsing errors.");
			//}
		});
	})

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
