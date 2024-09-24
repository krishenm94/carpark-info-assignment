# Overview

The original README for this assignment is documented in `PROBLEM.md`

Here, a quick overview of the project will be documented

This project is a nodejs project using express for routing and sqlite as an in-memory database

Please refer the `/src` folder for the source files

To initialise the project run `npm install` and then `npx tsc`

To run the project, run `npm start`

To visit the swagger UI, visit `http://localhost:3000/api-docs` in the browser.
There relevant API documentation can be found
The UI can be slow to load responses that are large though so to test the API that have large responses (GET /parking) please use a optimised HTTP client, like curl or Postman

A simple ER diagram can be found here:

<img src="er-diagram.png">

The [scheduled data sync](https://github.com/krishenm94/carpark-info-assignment/blob/ad0e1103330c0047e0a744846ef76229fca1141c/src/app.ts#L248) points to a delta file name `delta.csv` by default and runs every 9am
