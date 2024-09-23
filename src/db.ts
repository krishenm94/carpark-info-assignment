import sqlite3 from "sqlite3";
import fs from "fs";
import { parse } from "csv-parse";

// Initialise database
export const db = new sqlite3.Database("./app.db", (err) => {
  if (err) {
    return console.log(err.message);
  }
  console.log("INFO: Connected to database!");
});

db.exec(fs.readFileSync("./src/sql/schema.sql").toString());

export async function bulkInsertTransaction(csvFilePath: string) {
  const rows: string[][] = await new Promise((resolve, reject) => {
    const rows: string[][] = [];
    fs.createReadStream(csvFilePath)
      .pipe(parse({ delimiter: ",", from_line: 2 }))
      .on("data", function (row: string[]) {
        rows.push(row);
      })
      .on("error", function (error: Error) {
        console.log(`ERROR: ${error.message}`);
        reject(error);
      })
      .on("end", () => {
        resolve(rows);
      });
  });

  db.serialize(function () {
    db.exec("BEGIN", (error: Error) => {
      if (error) {
        console.error("ERROR: BEGIN");
        console.log(error);
        return;
      }
      console.log("INFO: Transaction begin");
    });
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      db.run(
        `INSERT INTO car_parks(car_park_no, address, x_coord, y_coord, car_park_type, type_of_parking_system, short_term_parking, free_parking, night_parking, car_park_decks, gantry_height, car_park_basement) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row,
        function (error: Error) {
          if (error) {
            // If there is an error running an insert rollback immediately
            db.run("ROLLBACK", (error: Error) => {
              if (error) {
                console.error("ERROR: ROLLBACK");
                console.log(error);
                return;
              }
              console.log("WARNING: Transaction rollback");
              console.log("WARNING: Database not populated!");
            });
            console.log(`ERROR: ${error.message}`);
            return;
          }
          console.log(`INFO: Inserted a row with the no: ${row[0]}`);
          if (index === rows.length - 1) {
            db.exec("COMMIT", (error: Error) => {
              if (error) {
                console.error("ERROR: COMMIT");
                console.log(error);
                return;
              }
              console.log("INFO: Transaction commit");
              console.log("INFO: Database populated!");
            });
          }
        }
      );
    }
  });
}
