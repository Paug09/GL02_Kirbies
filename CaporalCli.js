const fs = require("fs");
const colors = require("colors");
const CruParser = require("./CruParser.js");

const vg = require("vega");
const vegalite = require("vega-lite");

const cli = require("@caporal/core").default;
const { getStudentSchedule, generateICSFile } = require("./FonctionAnnexe"); // Importer les fonction

cli.version("cru-parser-cli")
    .version("0.01")
    // check Cru
    .command("check", "Check if <file> is a valid Cru file")
    .argument("<file>", "The file to check with Cru parser")
    .option("-s, --showSymbols", "log the analyzed symbol at each step", {
        validator: cli.BOOLEAN,
        default: false,
    })
    .option("-t, --showTokenize", "log the tokenization results", {
        validator: cli.BOOLEAN,
        default: false,
    })
    .option("-d, --showDebug", "log the debug information", {
        validator: cli.BOOLEAN,
        default: false,
    })
    .action(({ args, options, logger }) => {
        fs.readFile(args.file, "utf8", function (err, data) {
            if (err) {
                return logger.warn(err);
            }

            var analyzer = new CruParser(
                options.showTokenize,
                options.showSymbols,
                options.showDebug
            );
            analyzer.parse(data);

            if (analyzer.errorCount === 0) {
                logger.info("The .cru file is a valid cru file".green);
            } else {
                logger.info("The .cru file contains error".red);
                //Donne le nombre d'erreurs
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

    //readme
    .command("readme", "Display the README.txt file")
    .action(({ logger }) => {
        fs.readFile("./README.txt", "utf8", function (err, data) {
            if (err) {
                return logger.warn(err);
            }
            logger.info(data);
        });
    })
    //Spec 5 : Generate an .ics calendar for a student
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
