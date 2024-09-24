import express from "express";
import swaggerUi from "swagger-ui-express";
import { schedule } from "node-cron";

import { swaggerDocs } from "./swagger";
import { db, bulkInsertTransaction } from "./db";

const port = 3000;
const dataCsvPath = "./hdb-carpark-information-20220824010400.csv";
const deltaCsvPath = "./delta.csv";
const app = express();
// Enable json parsing
app.use(express.json());
// Add swagger doc UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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

/**
 * @swagger
 * /parking:
 *   get:
 *     summary: Get car parks
 *     description: Get car parks with a combination of optional filters, free, night & gantry height.
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         required: true
 *         description: Pagination offset
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: true
 *         description: Pagination limit
 *       - in: query
 *         name: free
 *         schema:
 *           type: string
 *         required: false
 *         description: If value is "true", return free car parks
 *       - in: query
 *         name: night
 *         schema:
 *           type: string
 *         required: false
 *         description: If value is "true", return car parks open at night
 *       - in: query
 *         name: height
 *         schema:
 *           type: float
 *         required: false
 *         description: Filters for car parks with gantry height larger than this supplied value
 *     responses:
 *       '200':
 *         description: A successful response
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */

app.get("/parking", (req, res) => {
  console.log(req.query);
  if (
    !req.query.limit ||
    isNaN(parseInt(req.query.limit as string)) ||
    !req.query.offset ||
    isNaN(parseInt(req.query.offset as string))
  ) {
    res.status(400);
    res.send(
      "Pagination parameters invalid. Please supply integer limit and offset"
    );
    return;
  }

  let sqlquery = `SELECT * FROM car_parks`;
  if (Object.keys(req.query).length === 2) {
    db.all(
      `${sqlquery} LIMIT ? OFFSET ?`,
      [req.query.limit as string, req.query.offset as string],
      getCallBack(res)
    );
    return;
  }

  let argAdded = false;
  let params: string[] = [];
  if (req.query.night && (req.query.night as string) === "true") {
    sqlquery = `${sqlquery} WHERE`;
    sqlquery = `${sqlquery} night_parking != "NO"`;
    argAdded = true;
  }
  if (req.query.free && (req.query.free as string) === "true") {
    if (argAdded) {
      sqlquery = `${sqlquery} AND`;
    } else {
      sqlquery = `${sqlquery} WHERE`;
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
    } else {
      sqlquery = `${sqlquery} WHERE`;
    }
    sqlquery = `${sqlquery} gantry_height > ?`;
    params.push(req.query.height as string);
  }

  params.push(req.query.limit as string);
  params.push(req.query.offset as string);

  sqlquery = `${sqlquery} LIMIT ? OFFSET ?`;
  db.all(sqlquery, params, getCallBack(res));
});

/**
 * @swagger
 * /parking/favorite/{email}:
 *   get:
 *     summary: Get user's car parks favourites
 *     description: Get the user's favourite car parks stored in database
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The user's email
 *     responses:
 *       '200':
 *         description: A successful response
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
app.get("/parking/favorite/:email", (req, res) => {
  if (!req.params.email) {
    res.status(400);
    res.send("Bad request. Please supply user email.");
  }

  console.log(req.params.email);

  const params: string[] = [req.params.email as string];

  const sqlquery = `SELECT car_parks.* FROM car_parks JOIN user_car_parks ON user_car_parks.car_park_no == car_parks.car_park_no WHERE user_car_parks.email_address == ?`;
  db.all(sqlquery, params, getCallBack(res));
});

/**
 * @swagger
 * /parking/favorite:
 *   post:
 *     summary: Add car parks to user's favourites
 *     description: Add car parks to user's favourites. If car park doesn't exist or user has already added the car park, then the request is not processed.
 *     consumes:
 *     requestBody:
 *       description: The user's email and new favorite car park no
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - carParkNo
 *             properties:
 *               email:
 *                 type: string
 *               carParkNo:
 *                 type: string
 *     responses:
 *       '204':
 *         description: A successful response
 *       '400':
 *         description: Bad request
 *       '500':
 *         description: Internal server error
 */
app.post("/parking/favorite", async (req, res) => {
  const body = req.body;
  if (!body.email || !body.carParkNo) {
    res.status(400);
    res.send("Invalid request body. Please supply email and carParkNo");
    return;
  }

  // If the car park does not exist in out database, we should return early without processing the request
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

  // If the favorite is already added, we should return early without processing the request
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

app.listen(port, async () => {
  await bulkInsertTransaction(dataCsvPath);
  return console.log(`INFO: Express is listening at http://localhost:${port}`);
});

schedule("0 0 9 * * *", async () => {
  console.log(
    `INFO: Running scheduled delta sync. Source file: ${deltaCsvPath}`
  );
  await bulkInsertTransaction(deltaCsvPath);
});
