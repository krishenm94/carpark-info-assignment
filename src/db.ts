import sqlite3 from "sqlite3";
import fs from "fs";
import { parse } from "csv-parse";

const filepath = "./app.db";
// Initialise database
export const db = new sqlite3.Database(filepath, (err) => {
  if (err) {
    return console.log(err.message);
  }
  console.log("Connected to database!");
});

// db.exec(fs.readFileSync("./src/sql/schema.sql").toString());
// fs.createReadStream("./hdb-carpark-information-20220824010400.csv")
//   .pipe(parse({ delimiter: ",", from_line: 2 }))
//   .on("data", function (row: string[]) {
//     // console.log(row);
//     db.serialize(function () {
//       db.run(
//         `INSERT INTO car_parks(car_park_no, address, x_coord, y_coord, car_park_type, type_of_parking_system, short_term_parking, free_parking, night_parking, car_park_decks, gantry_height, car_park_basement) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         row,
//         function (error: any) {
//           if (error) {
//             return console.log(error.message);
//           }
//           console.log(`Inserted a row with the no: ${row[0]}`);
//         }
//       );
//     });
//   });
// console.log("Database populated!");
