import express from "express";
import { db } from "./db";

const app = express();
app.use(express.json());
const port = 3000;

const getCallBack = (res: any) => {
  return (err: any, result: any) => {
    if (err) {
      console.log(err);
      res.status(500);
      res.send("Unknown error occured. Please try again later.");
      return;
    }
    res.status(200);
    res.send(result);
  };
};

const postCallBack = (res: any) => {
  return (err: any, result: any) => {
    if (err) {
      console.log(err);
      res.status(500);
      res.send("Unknown error occured. Please try again later.");
      return;
    }
    res.status(204);
    res.send("");
  };
};

app.get("/", (req, res) => {
  res.send("Car Park Assignment, from Handshakes, by Krishen Mohan");
});

app.get("/parking", (req, res) => {
  console.log(req.query);
  let sqlquery = `SELECT * FROM car_parks`;
  if (Object.keys(req.query).length === 0) {
    db.all(sqlquery, getCallBack(res));
    return;
  }

  sqlquery = `${sqlquery} WHERE`;
  let argAdded = false;
  let params: string[] = [];
  if (req.query.night && (req.query.night as string) === "true") {
    sqlquery = `${sqlquery} night_parking != "NO"`;
    argAdded = true;
  }
  if (req.query.free && (req.query.free as string) === "true") {
    if (argAdded) {
      sqlquery = `${sqlquery} AND`;
    }
    sqlquery = `${sqlquery} free_parking != "NO"`;
    argAdded = true;
  }
  if (req.query.height) {
    const height = parseFloat(req.query.height as string);
    if (isNaN(height)) {
      res.status(400);
      res.send("Invalid height value. Please use a number.");
      return;
    }
    if (argAdded) {
      sqlquery = `${sqlquery} AND`;
    }
    sqlquery = `${sqlquery} gantry_height > ?`;
    params.push(req.query.height as string);
  }

  db.all(sqlquery, params, getCallBack(res));
});

app.get("/parking/favorite", (req, res) => {
  if (!req.query.email) {
    res.status(400);
    res.send("Invalid argument. Please supply user email.");
  }

  const params: string[] = [req.query.email as string];

  const sqlquery = `SELECT car_parks.* FROM car_parks JOIN user_car_parks ON user_car_parks.car_park_no == car_parks.car_park_no WHERE user_car_parks.email == ?`;
  db.all(sqlquery, params, getCallBack(res));
});

app.post("/parking/favorite", async (req, res) => {
  console.log(req.body);
  const body = req.body;
  if (!body.email || !body.carParkNo) {
    res.status(400);
    res.send("Invalid request body. Please supply email and carParkNo");
    return;
  }

  let carParkExists: boolean = await new Promise((resolve, reject) => {
    db.all(
      `SELECT car_park_no FROM car_parks WHERE car_park_no = ?`,
      [body.carParkNo as string],
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500);
          res.send("Unknown error occured. Please try again later.");
          reject(err);
        }

        resolve(result.length > 0);
      }
    );
  });

  if (!carParkExists) {
    res.status(400);
    res.send("Car park does not exist. Please supply an existing car park");
    return;
  }

  const params: string[] = [body.email as string, body.carParkNo as string];

  let favoriteAdded: boolean = await new Promise((resolve, reject) => {
    db.all(
      `SELECT car_park_no FROM user_car_parks WHERE email_address = ? AND car_park_no = ?`,
      params,
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500);
          res.send("Unknown error occured. Please try again later.");
          reject(err);
        }

        resolve(result.length > 0);
      }
    );
  });

  if (favoriteAdded) {
    res.status(400);
    res.send(
      "This car parked is already saved for user. Request not processed."
    );
    return;
  }

  const insertquery = `INSERT INTO user_car_parks(email_address, car_park_no) VALUES(? ,?)`;
  db.all(insertquery, params, postCallBack(res));
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
