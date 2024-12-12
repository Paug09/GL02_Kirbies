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
			// Find all the different rooms
			function extractRooms(data) {
				const roomPattern = /S=([A-Za-z0-9]+)/g;
				const rooms = [];
				let match;

				while ((match = roomPattern.exec(data)) !== null) {
					rooms.push(match[1]);
				}
				return rooms.filter((value, index, self) => self.indexOf(value) === index); // Delete duplicated entries
			}

			const allRooms = extractRooms(data);

			// find the given room in the database
			const roomToSearch = allRooms.find(room => room === args.room);

			// Stoque tous les crénaux trouvables dans la base de données
			/*function uniqueSchedules(data) {
				const schedulePattern = /H=(L|MA|ME|J|V|S) (([8-9]|1[0-9]|20):[0-5][0-9])/g;
				const schedules = [];
				let match;

				while ((match = schedulePattern.exec(data)) !== null) {
					schedules.push(match[1]);
				}

				return schedules.filter((value, index, self) => self.indexOf(value) === index); // Supprime les doublons
			}*/
			// Stoque tous les crénaux de 30 minutes pour les jours, de 8h à 20h, de la semaine, sans le dimanche.
			function allSchedules() {
				const daysOfWeek = ["L", "MA", "ME", "J", "V", "S"];
				const startHour = 8;  // Heure de début (8h)
				const endHour = 20;   // Heure de fin (20h)
				const schedules = [];

				for (let day of daysOfWeek) {
					for (let hour = startHour; hour < endHour; hour++) {
						const startTime = `${hour.toString()}:00`;
						const endTime = `${hour.toString()}:30`;
						schedules.push(`${day} ${startTime}-${endTime}`);

						const startTime2 = `${hour.toString()}:30`;
						const endTime2 = `${(hour + 1).toString()}:00`;
						schedules.push(`${day} ${startTime2}-${endTime2}`);
					}
				}
				return schedules;
			}

			// Redécoupe des créneaux en créneaux de 30 minutes
			function sameCutSchedules(timeRange, dayOfWeek) {
				const startTime = timeRange.split("-")[0];  // Horaire de début
				const startHour = startTime.split(":")[0]; // Heure de début
				const startMinute = startTime.split(":")[1]; // Minutes de début
				const endTime = timeRange.split("-")[1];   // Horaire de fin
				const endHour = endTime.split(":")[0]; // Heure de fin
				const endMinute = endTime.split(":")[1]; // Minutes de fin
				const schedules = [];

				console.log(schedules + "---------------------------schedule début--------------------------");
				console.log(`${startHour}`)


				for (let hour = startHour; hour < endHour; hour++) {
					if (startMinute === "00" || hour != startHour) {
						const startTime = `${hour.toString()}:00`;
						const endTime = `${hour.toString()}:30`;
						schedules.push(`${dayOfWeek} ${startTime}-${endTime}`);
						console.log(schedules + "---------------------------schedules start min 00 ou =! start hour--------------------------");
					}

					const startTime = `${hour.toString()}:30`;
					const endTime = `${(parseInt(hour) + 1).toString()}:00`;
					schedules.push(`${dayOfWeek} ${startTime}-${endTime}`);
					console.log(schedules + "---------------------------schedules en général--------------------------");


					if ((hour == (parseInt(endHour) - 1)) && endMinute === "30") {
						const startTime = `${endHour.toString()}:00`;
						const endTime = `${(endHour).toString()}:30`;
						schedules.push(`${dayOfWeek} ${startTime}-${endTime}`);
						console.log(schedules + "---------------------------schedules si finit par 30--------------------------");
					}
				}
				console.log(schedules + "---------------------------schedules fin--------------------------");
				return schedules;
			}

			// if the room is found
			if (roomToSearch) {
				// Trouver les moments où est occupée la salle
				const occupiedSlots = [];
				const dayMapping = { "L": 1, "MA": 2, "ME": 3, "J": 4, "V": 5, "S": 6 };
				const reversedDayMapping = Object.fromEntries(
					Object.entries(dayMapping).map(([key, value]) => [value, key])
				);

				analyzer.ParsedCourse.forEach(course =>
					course.timeSlots.forEach(slot => {
						const dayOfWeek = dayMapping[slot.horaire.split(" ")[0]]; // Récupère le jour
						const timeRange = slot.horaire.split(" ")[1]; // Récupère "08:00-10:00"
						if (slot.salle === roomToSearch) {
							occupiedSlots.push(`${reversedDayMapping[dayOfWeek]} ${timeRange}`); //Ajoute le crénaux au tableau des crénaux occupés
							console.log(`The room is occupied during the time slot: ${slot.horaire}`);
						}
					}));

				// Calculer les moments où la salle est disponible
				const allFreeMoment = allSchedules();
				const occupiedSlotsCut = [];
				occupiedSlots.forEach(slot => {
					console.log(slot + "---------------------------slot--------------------------");
					const dayOfWeek = slot.split(" ")[0]; // Récupère le jour
					console.log(dayOfWeek + "---------------------------dayOfWeek--------------------------");
					const timeRange = slot.split(" ")[1]; // Récupère "08:00-10:00"
					occupiedSlotsCut.push(sameCutSchedules(timeRange, dayOfWeek));
				});
				console.log(occupiedSlots + "---------------------------occupiedSlots--------------------------");
				console.log(occupiedSlotsCut + "---------------------------occupiedSlotsCut--------------------------");

				const availabilityRoom = allFreeMoment.filter(slot => !occupiedSlotsCut.includes(slot));

				if (availabilityRoom.length > 0) {
					logger.info(`The room ${args.room} is available on the following slots:`);
					availabilityRoom.forEach(slot => logger.info(`- ${slot}`));
				} else {
					logger.warn(`The room ${args.room} does not have any available slots.`);
				}

			} else {
				logger.warn(`No room found with the name: ${args.room}`);
			}

			//} else {
			//	logger.warn("The .cru file contains parsing errors.");
			//}
		});
	})

	// track the occupancy of a room
	.command('occupancyRoom', 'Track the occupancy of a room during a specific time period')
	.argument('<file>', 'The Cru file to search')
	.argument('<room>', 'The room you want to track the occupancy')
	.argument('[startTime]', 'The start time for the tracking period (e.g., ME 08:30)', 'L 08:00')  // Argument non obligatoire avec valeur par défaut
	.argument('[endTime]', 'The end time for the tracking period (e.g., V 10:00)', 'S 12:00')    // Argument non obligatoire avec valeur par défaut
	.action(({ args, logger }) => {
		logger.warn(`${args.room} --------- ${args.startTime} ----------- ${args.endTime} `);

		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			const analyzer = new CruParser();
			analyzer.parse(data);

			//if (analyzer.errorCount === 0) {
			// Find all the different rooms
			function extractRooms(data) {
				const roomPattern = /S=([A-Za-z0-9]+)/g;
				const rooms = [];
				let match;

				while ((match = roomPattern.exec(data)) !== null) {
					rooms.push(match[1]);
				}
				return rooms.filter((value, index, self) => self.indexOf(value) === index); // Delete duplicated entries
			}

			const allRooms = extractRooms(data);

			// find the given room in the database
			const roomToSearch = allRooms.find(room => room === args.room);

			// Stoque tous les crénaux trouvables dans la base de données
			/*function uniqueSchedules(data) {
				const schedulePattern = /H=(L|MA|ME|J|V|S) (([8-9]|1[0-9]|20):[0-5][0-9])/g;
				const schedules = [];
				let match;

				while ((match = schedulePattern.exec(data)) !== null) {
					schedules.push(match[1]);
				}

				return schedules.filter((value, index, self) => self.indexOf(value) === index); // Supprime les doublons
			}*/

			function allSchedules() {
				const daysOfWeek = ["L", "MA", "ME", "J", "V", "S"];
				const startHour = 8;  // Heure de début (8h)
				const endHour = 20;   // Heure de fin (20h)
				const schedules = [];

				for (let day of daysOfWeek) {
					for (let hour = startHour; hour < endHour; hour++) {
						const startTime = `${hour.toString()}:00`;
						const endTime = `${hour.toString()}:30`;
						schedules.push(`${day} ${startTime}-${endTime}`);

						const startTime2 = `${hour.toString()}:30`;
						const endTime2 = `${(hour + 1).toString()}:00`;
						schedules.push(`${day} ${startTime2}-${endTime2}`);
					}
				}
				return schedules;
			}

			// if the room is found
			if (roomToSearch) {
				// Trouver les moments où est occupée la salle
				const occupiedSlots = [];
				const dayMapping = { "L": 1, "MA": 2, "ME": 3, "J": 4, "V": 5, "S": 6 };

				analyzer.ParsedCourse.forEach(course =>
					course.timeSlots.forEach(slot => {
						const dayOfWeek = dayMapping[slot.horaire.split(" ")[0]]; // Récupère le jour
						const timeRange = slot.horaire.split(" ")[1]; // Récupère "08:00-10:00"
						const slotStart = timeRange.split("-")[0];
						const slotEnd = timeRange.split("-")[1];

						if (
							(slotStart >= args.startTime && slotStart < args.endTime) ||
							(slotEnd > args.startTime && slotEnd <= args.endTime)
						) {
							if (slot.salle === roomToSearch) {
								occupiedSlots.push(`${dayOfWeek} ${timeRange}`); //Ajoute le crénaux au tableau des crénaux occupés
								console.log(`The room is occupied during the time slot: ${slot.horaire}`);
							}
						}
					})
				);

				// Affiche en bullet point
				if (occupiedSlots.length > 0) {
					console.log(`The room ${args.room} is occupied on the following slots:`);
					occupiedSlots.forEach(slot => logger.info(`- ${slot}`));
				} else {
					logger.warn(`The room ${args.room} is never occupied between ${args.startTime} and ${args.endTime} `);
				};

				// Calculer les moments où la salle est disponible
				const allFreeMoment = allSchedules();
				const availabilityRoom = allFreeMoment.filter(slot => !occupiedSlots.includes(slot));

				// Affiche en bullet point
				if (availabilityRoom.length > 0) {
					logger.info(`The room ${args.room} is available on the following slots:`);
					availabilityRoom.forEach(slot => logger.info(`- ${slot}`));
				} else {
					logger.warn(`The room ${args.room} does not have any available slots.`);
				}
			} else {
				logger.warn(`No room found with the name: ${args.room}`);
			}

			//} else {
			//	logger.warn("The .cru file contains parsing errors.");
			//}
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

			function allSchedules() {
				const daysOfWeek = ["L", "MA", "ME", "J", "V", "S"];
				const startHour = 8;  // Heure de début (8h)
				const endHour = 20;   // Heure de fin (20h)
				const schedules = [];

				for (let day of daysOfWeek) {
					for (let hour = startHour; hour < endHour; hour++) {
						const startTime = `${hour.toString()}:00`;
						const endTime = `${hour.toString()}:30`;
						schedules.push(`${day} ${startTime}-${endTime}`);

						const startTime2 = `${hour.toString()}:30`;
						const endTime2 = `${(hour + 1).toString()}:00`;
						schedules.push(`${day} ${startTime2}-${endTime2}`);
					}
				}
				return schedules;
			}

			// Redécoupe des créneaux en créneaux de 30 minutes
			/*function sameCutSchedules(timeRange, dayOfWeek) {
				const startTime = timeRange.split("-")[0];  // Horaire de début
				const startHour = startTime.split(":")[0]; // Heure de début
				const startMinute = startTime.split(":")[1]; // Minutes de début
				const endTime = timeRange.split("-")[1];   // Horaire de fin
				const endHour = endTime.split(":")[0]; // Heure de fin
				const endMinute = endTime.split(":")[1]; // Minutes de fin
				const schedules = [];

				console.log(schedules + "---------------------------schedule début--------------------------");
				console.log(startTime + startHour + startMinute + endTime + endHour + endMinute);


				for (let hour = startHour; hour < endHour; hour++) {
					if (startMinute === "00" || hour != startHour) {
						const startTime = `${hour.toString()}:00`;
						const endTime = `${hour.toString()}:30`;
						schedules.push(`${dayOfWeek} ${startTime}-${endTime}`);
						console.log(schedules + "---------------------------schedules start min 00 ou =! start hour--------------------------");
					}

					const startTime = `${hour.toString()}:30`;
					const endTime = `${(parseInt(hour) + 1).toString()}:00`;
					schedules.push(`${dayOfWeek} ${startTime}-${endTime}`);
					console.log(schedules + "---------------------------schedules en général--------------------------");


					if ((hour == (parseInt(endHour) - 1)) && endMinute === "30") {
						const startTime = `${endHour.toString()}:00`;
						const endTime = `${(endHour).toString()}:30`;
						schedules.push(`${dayOfWeek} ${startTime}-${endTime}`);
						console.log(schedules + "---------------------------schedules si finit par 30--------------------------");
					}
				}
				console.log(schedules + "---------------------------schedules fin--------------------------");
				return schedules;
			}*/

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


			// Find all the differents rooms of the data
			function uniqueRooms(data) {
				const roomPattern = /S=([A-Z]\d{3})|([A-Z]{3}\d)/g;
				const rooms = [];
				let match;

				while ((match = roomPattern.exec(data)) !== null) {
					rooms.push(match[1]);
				}

				return rooms.filter((value, index, self) => self.indexOf(value) === index); // Supprime les doublons
			}

			// Étape 1 : Récupérer les créneaux occupés pour chaque salle
			const roomOccupancyData = [];
			analyzer.ParsedCourse.forEach(course => {
				course.timeSlots.forEach(slot => {
					const room = slot.salle;
					const occupiedSlots = getOccupiedSlots(analyzer.ParsedCourse, room);
					const totalSlots = 28 * 6 - 20; // Exemple : 28 créneaux de 30 minutes par semaine (8h à 22h)
					let occupiedCount = occupiedSlots.length;
					console.log(`OccupiedCount = ${occupiedCount}`)
					if (!roomOccupancyData.some(roomData => roomData.room === room)) {
						roomOccupancyData.push({
							room,
							occupiedCount,
							totalSlots,
							capacity: slot.capacite // Si disponible dans le fichier .cru
						});
					}

				});
			});

			// Itération sur les clés de l'objet 'rooms'
			roomOccupancyData.forEach(data => {
				// Récupérer le pourcentage d'occupation de la salle dans 'rooms'
				const occupencyPercentage = ((data.occupiedCount/data.totalSlots)*100).toFixed(2);

				// Récupérer la capacité de la salle dans 'capacity'
				const roomCapacity = data.capacity;

				// Afficher le pourcentage d'occupation et la capacité de chaque salle
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




			// Si vous souhaitez récupérer l'objet trié à nouveau
			// Itération sur les clés de l'objet 'rooms'
			Object.keys(occupencyPercentageAllRooms).forEach(room => {
				console.log(`---------------------------------------------${room}`);

				// Récupérer le pourcentage d'occupation de la salle dans 'rooms'
				const occupencyPercentage = occupencyPercentageAllRooms[room];
				console.log(`---------------------------------------------${JSON.stringify(occupencyPercentageAllRooms[room])}`);

				// Récupérer la capacité de la salle dans 'capacity'
				const roomCapacity = capacity[room];
				console.log(`---------------------------------------------${JSON.stringify(capacity[room])}`);


				// Afficher le résultat
				console.log(`Room: ${room}`);
				console.log(`  Occupancy Percentage: ${occupencyPercentage}%`);
				console.log(`  Capacity: ${roomCapacity}`);
				console.log('----------------------------');
			});




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
