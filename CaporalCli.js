const fs = require('fs');
const colors = require('colors');
const CruParser = require('./CruParser.js');

const vg = require('vega');
const vegalite = require('vega-lite');

const cli = require("@caporal/core").default;

cli
	.version('cru-parser-cli')
	.version('0.02')

	// check Cru
	.command('check', 'Check if <file> is a valid Cru file')
	.argument('<file>', 'The file to check with Cru parser')
	.option('-s, --showSymbols', 'log the analyzed symbol at each step', { validator: cli.BOOLEAN, default: false })
	.option('-t, --showTokenize', 'log the tokenization results', { validator: cli.BOOLEAN, default: false })
	.action(({ args, options, logger }) => {

		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			var analyzer = new CruParser(options.showTokenize, options.showSymbols);
			analyzer.parse(data);

			if (analyzer.errorCount === 0) {
				logger.info("The .cru file is a valid cru file".green);
			} else {
				logger.info("The .cru file contains error".red);
			}

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
	.option(`-c, --capacity`, `--Shows capacity of the room(s)`, { validator: cli.BOOLEAN, default: false })
	.action(({ args, options, logger }) => {
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			analyzer = new CruParser();
			analyzer.parse(data);

			if (analyzer.errorCount === 0) {

				// we create the variable courseToSearch, found by its name
				let courseToSearch = analyzer.parsedCourse.find(UE => UE.name === args.course);

				// if the course is found in the file, we print its name and the room(s) associated
				if (courseToSearch) {
					logger.info(`Course : ${courseToSearch.name}`);
					courseToSearch.slot_id.forEach(slot => {
						logger.info(`Room: ${slot.room}`)
					})

					// if the option -c is called...
					if (options.capacity) {

						// ...we take the capacity, ridden of the part "P=", and transformed in an int
						let capacity = parseInt(slot.capacity.split('=')[1], 10);
						logger.info(`Capcity: ${capacity}`);
					}
				}
				else {
					logger.warn("No rooms found for the given course")
				}
			} else {
				logger.info("The .cru file contains error".red);
			}

		});
	})

	// search rooms with a given time slot
	.command('searchRoom', 'Looks for the rooms available at a given time slot')
	.argument('<file>', 'The Cru file to search')
	.argument('<day>', 'The day you want to know the available rooms (L, MA, ME, J, V, or S')
	.argument('<timeSlot>', 'The time slot you want to search (e.g., 14:00-16:00)')
	.action(({ args, logger }) => {
		// Lire le fichier .cru
		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			const analyzer = new CruParser();
			analyzer.parse(data);

			if (analyzer.errorCount === 0) {
				// Fonction pour extraire toutes les salles du fichier
				function extractRooms(data) {
					const roomPattern = /S=([A-Za-z0-9]+)/g;
					const rooms = [];
					let match;

					// Extracting the rooms
					while ((match = roomPattern.exec(data)) !== null) {
						rooms.push(match[1]);
					}

					// Erasing double values
					rooms.filter((value, index, self) => {
						return self.indexOf(value) === index; 
					});

					return rooms;
				}

				// Extract the rooms and asign them to allRooms
				let allRooms = extractRooms(data);


				// Find free rooms
				const occupiedRooms = [];
				analyzer.parsedCourse.forEach(course => {
					course.slots.forEach(slot => {
						const [slotDay, slotTime] = slot.time.split(' ');
						if (slotDay === args.day && slotTime === args.timeSlot) {
							occupiedRooms.push(slot.room);
						}
					});
				});

				// List of available rooms
				const availableRooms = allRooms.filter(room => !occupiedRooms.includes(room));

				if (availableRooms.length > 0) {
					logger.info(`Rooms available on ${args.day} during the time slot ${args.timeSlot}:`);
					availableRooms.forEach(room => logger.info(`- ${room}`));
				} else {
					logger.warn(`No rooms available on ${args.day} during the time slot ${args.timeSlot}.`);
				}
			} else {
				logger.info("The .cru file contains error".red);
			}
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
