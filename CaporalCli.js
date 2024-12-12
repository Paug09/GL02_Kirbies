const fs = require("fs");
const CruParser = require("./CruParser.js");
const cli = require("@caporal/core").default;

// Importer les fonctions nécéssaires à la génération de l'ICS
const { getStudentSchedule, generateICSFile } = require("./GenerateICS");

// Importer les fonctions nécéssaires à l'authentification et à la vérification des permissions
const { roles, users, checkPermission, promptUserForName } = require("./userManager.js");

cli.version("cru-parser-cli")
    .version("0.06")
    // check Cru
    .command("check", "Check if <file> is a valid Cru file")
    .argument("<file>", "The file to check with Cru parser")
    .option("-t, --showTokenize", "log the tokenization results", { validator: cli.BOOLEAN, default: false })
    .option("-d, --showDebug", "log the debug information", { validator: cli.BOOLEAN, default: false })
    .action(({ args, options, logger }) => {
        fs.readFile(args.file, "utf8", function (err, data) {
            if (err) {
                return logger.warn(err);
            }

            const analyzer = new CruParser(options.showTokenize, options.showDebug);
            analyzer.parse(data);

            if (analyzer.errorCount === 0) {
                logger.info("The .cru file is a valid cru file".green);
            } else {
                logger.info("The .cru file contains error".red);
                // display how many errors there are
                logger.info("Error count : %d", analyzer.errorCount);
            }

            analyzer.ParsedCourse.forEach((course) => {
                console.log(`Course Code: ${course.courseCode}`);
                course.timeSlots.forEach((ts, index) => {
                    console.log(`- Time Slot ${index + 1}: ${ts.toString()}`);
                });
            });
            logger.debug(analyzer.parsedCourse);
        });
    })

    // readme
    .command("readme", "Display the README.txt file")
    .action(({ logger }) => {
        fs.readFile("./README.txt", "utf8", function (err, data) {
            if (err) {
                return logger.warn(err);
            }
            logger.info(data);
        });
    })

    // SPEC 1 and 2 : search rooms with a given course, and give the capacity if wanted
    .command("findCourseRooms", "Looks for the rooms associated with a course")
    .argument("<file>", "The Cru file to search")
    .argument("<course>", "The course you want to search")
    .option("-c, --capacity", "Shows capacity of the room(s)", { validator: cli.BOOLEAN, default: false })
    .action(({ args, options, logger }) => {
        fs.readFile(args.file, "utf8", function (err, data) {
            if (err) {
                return logger.warn(err);
            }

            const analyzer = new CruParser();
            analyzer.parse(data);

            if (analyzer.errorCount === 0) {
                // find the given course in the file
                let courseToSearch = analyzer.ParsedCourse.find((course) => course.courseCode === args.course);

                // if the course is found
                if (courseToSearch) {
                    console.log(`Rooms that welcome the course ${courseToSearch.courseCode}:`);

                    courseToSearch.timeSlots.forEach((ts) => {
                        console.log(`- ${ts.salle}`);

                        // if the user wants to know the capacity of the room
                        if (options.capacity) {
                            let capacity = parseInt(ts.capacite);
                            console.log(`  Capacity: ${capacity}`);
                        }
                    });
                } else {
                    logger.warn("No rooms found for the given course.");
                }
            } else {
                logger.error("The .cru file contains parsing errors.");
            }
        });
    })

    // SPEC 2 : search capacity of a given room
    .command("findRoomCapacity", "Looks for the capacity of a given room")
    .argument("<file>", "The Cru file to search")
    .argument("<room>", "The room you want to search")
    .action(({ args, logger }) => {
        fs.readFile(args.file, "utf8", function (err, data) {
            if (err) {
                return logger.warn(err);
            }

            const analyzer = new CruParser();
            analyzer.parse(data);

            if (analyzer.errorCount === 0) {
                let found = false;
                let capacity = 0;

                // search for the room in the file
                analyzer.ParsedCourse.forEach((course) => {
                    course.timeSlots.forEach((ts) => {
                        // if the room was found
                        if (ts.salle === args.room) {
                            found = true;
                            capacity = parseInt(ts.capacite);
                        }
                    });
                });
                if (found === true) {
                    console.log(`Capacity of the room ${args.room} : ${capacity}`);
                } else {
                    console.error(`The room ${args.room} was not found in the given file.`);
                }
            } else {
                logger.error("The .cru file contains parsing errors.");
            }
        });
    })

    // SPEC 4 : search available rooms with a given time slot
    .command("findAvailableRooms", "Looks for the rooms available at a given time slot")
    .argument("<file>", "The Cru file to search")
    .argument("<day>", "The day you want to know the available rooms (L, MA, ME, J, V, or S)")
    .argument("<timeSlot>", "The time slot you want to search (e.g., 08:00-10:00)")
    .action(({ args, logger }) => {
        // convert the first letter of the day to the entire word
        const dayOfTheWeek = {
            L: "Lundi",
            MA: "Mardi",
            ME: "Mercredi",
            J: "Jeudi",
            V: "Vendredi",
            S: "Samedi",
        };

        // we just want the start and end hours, we're not interested in the minutes.
        let beginningTimeSlot = args.timeSlot.split("-")[0]; // we divide the argument "timeSlot" and only take the part before the "-", which is the beginning of the time slot
        let beginningToCompare = parseInt(beginningTimeSlot.split(":")[0]); // we only take what comes before the ":", which is the hour
        let endTimeSlot = args.timeSlot.split("-")[1]; // we divide the argument "timeSlot" and only take the part after the "-", which is the end of the time slot
        let endToCompare = parseInt(endTimeSlot.split(":")[0]); // we only take what comes before the ":", which is the hour

        fs.readFile(args.file, "utf8", function (err, data) {
            if (err) {
                return logger.warn(err);
            }

            const analyzer = new CruParser();
            analyzer.parse(data);

            if (analyzer.errorCount === 0) {
                // find all the different rooms
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

                // find all the occupied rooms
                let occupiedRooms = [];
                analyzer.ParsedCourse.forEach((course) => {
                    course.timeSlots.forEach((slot) => {
                        // extract only the hour, not the minutes of the time slots of the file, like we did for the argument "timeSlot"
                        let hours = slot.horaire.split(" ")[1];
                        let beginningSlotTime = hours.split("-")[0];
                        let beginningSlotHour = parseInt(beginningSlotTime.split(":")[0]);
                        let endSlotTime = hours.split("-")[1];
                        let endSlotHour = parseInt(endSlotTime.split(":")[0]);

                        // extract only the day of the time slots of the file
                        let slotDay = slot.horaire.split(" ")[0];

                        let isOverlapping =
                            (beginningSlotHour >= beginningToCompare && beginningSlotHour < endToCompare) || // is the beginning of the time slot in the interval
                            (endSlotHour > beginningToCompare && endSlotHour <= endToCompare) || // is the end of the time slot in the interval
                            (beginningSlotHour <= beginningToCompare && endSlotHour >= endToCompare); // does the time slot covers the entire interval

                        if (slotDay === args.day && isOverlapping) {
                            //if we want to know wich rooms are unavailable :
                            //console.log(`Room ocupied : ${slot.salle} (${slot.horaire})`);
                            occupiedRooms.push(slot.salle);
                        }
                    });
                });

                // calculate the available rooms
                let availableRooms = allRooms.filter((room) => !occupiedRooms.includes(room));

                // display the result
                if (availableRooms.length > 0) {
                    logger.info(`Rooms available on ${dayOfTheWeek[args.day]} during the time slot ${args.timeSlot} :`);
                    availableRooms.forEach((room) => console.log(`- ${room}`));
                } else {
                    logger.warn(
                        `No rooms available on ${dayOfTheWeek[args.day]} during the time slot ${args.timeSlot}.`
                    );
                }
            } else {
                logger.error("The .cru file contains errors.".red);
            }
        });
    })

    // SPEC 5 : Generate an .ics calendar for a student
    .command("generateCalendar", "Generate an .ics calendar for a student")
    .argument("<file>", "The Cru file to use")
    .argument("<selectedCourses>", 'Comma-separated list of course codes (e.g., "CL02,CL07")')
    .argument("<startDate>", "The start date in YYYY-MM-DD format")
    .argument("<endDate>", "The end date in YYYY-MM-DD format")
    .option("-o, --output <file>", "The output file", { default: "calendar.ics" })
    .action(({ args, options, logger }) => {
        fs.readFile(args.file, "utf8", function (err, data) {
            var analyzer = new CruParser();
            analyzer.parse(data);

            const { selectedCourses, startDate, endDate } = args;
            const outputFile = options.output; // Récupère le nom du fichier
            // Assurez-vous que ParsedCourse est défini et contient les cours analysés
            const parsedCourses = analyzer.ParsedCourse; // Remplacez par votre instance réelle

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start) || isNaN(end)) {
                logger.error("Invalid date format. Please use YYYY-MM-DD.");
                return;
            }

            const events = getStudentSchedule(parsedCourses, selectedCourses, start, end);
            if (events.length === 0) {
                logger.info("No events found for the given courses and date range.");
                return;
            }

            generateICSFile(events, outputFile); // Utilise le nom de fichier passé ou celui par défaut
            logger.info(`Calendar generated successfully: ${outputFile}`);
        });
    })

    // SPEC 6 : check the data quality
    .command("verifySchedule", "Verify if there are any overlapping courses in the schedule")
    .argument("<file>", "The Cru file to check")
    .action(async ({ args, logger }) => {
        const username = await promptUserForName();
        const hasPermission = checkPermission(username, users, roles.admin);

        if (!hasPermission) {
            logger.error("Access denied. This command is restricted to admins.");
            return;
        }

        logger.info("Access granted. Here are the parsed courses:");
        const fs = require("fs");
        const dayOfTheWeek = {
            L: "Lundi",
            MA: "Mardi",
            ME: "Mercredi",
            J: "Jeudi",
            V: "Vendredi",
            S: "Samedi",
        };

        fs.readFile(args.file, "utf8", function (err, data) {
            if (err) {
                return logger.warn(err);
            }

            const analyzer = new CruParser();
            analyzer.parse(data);

            if (analyzer.errorCount === 0) {
                let overlaps = []; // List to stock the overlapping courses

                // Group the time slots by room
                let roomSchedules = {};
                analyzer.ParsedCourse.forEach((course) => {
                    course.timeSlots.forEach((slot) => {
                        if (!roomSchedules[slot.salle]) {
                            // is the room is not aleady in the list
                            roomSchedules[slot.salle] = []; // we create a list corresponding to its name
                        }
                        roomSchedules[slot.salle].push({
                            // in the list of the room, we add the course code, the time slot and the day when the room is occupied
                            course: course.courseCode,
                            start: slot.horaire.split(" ")[1].split("-")[0],
                            end: slot.horaire.split(" ")[1].split("-")[1],
                            day: slot.horaire.split(" ")[0],
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
                        let current = schedule[i];
                        let next = schedule[i + 1];

                        // Verify if the time slots are overlapping on the same day
                        if (current.day === next.day && current.end > next.start) {
                            overlaps.push({
                                room,
                                courses: [current.course, next.course],
                                day: current.day,
                                times: [`${current.start}-${current.end}`, `${next.start}-${next.end}`],
                            });
                        }
                    }
                }

                // Print the results
                if (overlaps.length > 0) {
                    logger.warn("Overlapping courses detected:");
                    overlaps.forEach((overlap) => {
                        logger.info(`Room: ${overlap.room}`);
                        console.log(`Day: ${dayOfTheWeek[overlap.day]}`);
                        console.log(`Courses: ${overlap.courses.join(", ")}`);
                        console.log(`Time: ${overlap.times[0]}`);
                    });
                } else {
                    logger.info("No overlapping courses detected. The schedule is valid.");
                }
            } else {
                logger.error("The .cru file contains errors. Unable to verify schedule.");
            }
        });
    });

cli.run(process.argv.slice(2));
