const fs = require('fs');
//const colors = require('colors');
const CruParser = require('./CruParser.js');

//const vg = require('vega');
//const vegalite = require('vega-lite');

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

	.command('roomsForSlot', 'Looks for the rooms available at a given time slot')
	.argument('<file>', 'The Cru file to search')
	.argument('<day>', 'The day you want to know the available rooms (L, MA, ME, J, V, or S)')
	.argument('<timeSlot>', 'The time slot you want to search (e.g., 08:00-10:00)')
	.action(({ args, logger }) => {
		let schedule = args.day + ' ' + args.timeSlot
		const dayOfTheWeek = { "L": "Lundi", "MA": "Mardi", "ME": "Mercredi", "J": "Jeudi", "V": "Vendredi", "S": "Samedi" };

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

			// Find all the occupied rooms
			const occupiedRooms = [];
			analyzer.ParsedCourse.forEach(course => {
				course.timeSlots.forEach(slot => {
					if (slot.horaire === schedule) {
						console.log(`Room not available : ${slot.salle}`);
						occupiedRooms.push(slot.salle);
					}
				});
			});

			// Calculate the available rooms
			const availableRooms = allRooms.filter(room => !occupiedRooms.includes(room));

			// Print the result
			if (availableRooms.length > 0) {
				logger.info(`Rooms available on ${dayOfTheWeek[args.day]} during the time slot ${args.timeSlot} :`);
				availableRooms.forEach(room => console.log(`- ${room}`));
			} else {
				logger.warn(`No rooms available on ${dayOfTheWeek[args.day]} during the time slot ${args.timeSlot}.`);
			}
			//} else {
			//	logger.info("The .cru file contains errors.".red);
			//}
		});
	})

	.command('verifySchedule', 'Verify if there are any overlapping courses in the schedule')
	.argument('<file>', 'The Cru file to check')
	.action(({ args, logger }) => {
		const fs = require('fs');
		const dayOfTheWeek = { "L": "Lundi", "MA": "Mardi", "ME": "Mercredi", "J": "Jeudi", "V": "Vendredi", "S": "Samedi" };

		fs.readFile(args.file, 'utf8', function (err, data) {
			if (err) {
				return logger.warn(err);
			}

			const analyzer = new CruParser();
			analyzer.parse(data);

			//if (analyzer.errorCount === 0) {
			const overlaps = []; // List to stock the overlapping courses

			// Group the time slots by room
			const roomSchedules = {};
			analyzer.ParsedCourse.forEach(course => {
				course.timeSlots.forEach(slot => {
					if (!roomSchedules[slot.salle]) { // is the room is not aleady in the list
						roomSchedules[slot.salle] = []; // we create a list corresponding to its name
					}
					roomSchedules[slot.salle].push({
						// in the list of the room, we add the course code, the time slot and the day when the room is occupied
						course: course.courseCode,
						start: slot.horaire.split(' ')[1].split('-')[0],
						end: slot.horaire.split(' ')[1].split('-')[1],
						day: slot.horaire.split(' ')[0]
					});
				});
			});

			// Verify the overlapping for each rooms
			for (let room in roomSchedules) {
				let schedule = roomSchedules[room];

				// Sort by day and start time
				schedule.sort((a, b) => {
					if (a.day !== b.day) {
						return a.day.localeCompare(b.day);
					}
					return a.start.localeCompare(b.start);
				});

				// Compare slots to detect overlaps
				for (let i = 0; i < schedule.length - 1; i++) {
					const current = schedule[i];
					const next = schedule[i + 1];

					// Verify if the time slots are overlapping on the same day
					if (current.day === next.day && current.end > next.start) {
						overlaps.push({
							room,
							courses: [current.course, next.course],
							day: current.day,
							times: [`${current.start}-${current.end}`, `${next.start}-${next.end}`]
						});
					}
				}
			}

			// Print the results
			if (overlaps.length > 0) {
				logger.warn("Overlapping courses detected:");
				overlaps.forEach(overlap => {
					logger.info(`Room: ${overlap.room}`);
					console.log(`Day: ${dayOfTheWeek[overlap.day]}`);
					console.log(`Courses: ${overlap.courses.join(', ')}`);
					console.log(`Time: ${overlap.times[0]}`);
				});
			} else {
				logger.info("No overlapping courses detected. The schedule is valid.");
			}
			//} else {
			//	logger.error("The .cru file contains errors. Unable to verify schedule.");
			//}
		});
	});

cli.run(process.argv.slice(2));
