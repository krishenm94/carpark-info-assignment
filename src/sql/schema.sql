DROP TABLE IF EXISTS car_parks;
DROP TABLE IF EXISTS user_car_parks;

CREATE TABLE IF NOT EXISTS car_parks (
    car_park_no TEXT NOT NULL PRIMARY KEY DESC ,
    address TEXT NOT NULL,
    x_coord REAL NOT NULL,
    y_coord REAL NOT NULL,
    car_park_type TEXT NOT NULL,
    type_of_parking_system TEXT NOT NULL,
    short_term_parking TEXT NOT NULL,
    free_parking TEXT NOT NULL,
    night_parking TEXT NOT NULL,
    car_park_decks INTEGER NOT NULL,
    gantry_height REAL NOT NULL,
    car_park_basement TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS index_free_parking
ON car_parks(free_parking);
CREATE INDEX IF NOT EXISTS index_night_parking
ON car_parks(night_parking);
CREATE INDEX IF NOT EXISTS index_gantry_height
ON car_parks(gantry_height);

CREATE TABLE IF NOT EXISTS user_car_parks (
    email_address TEXT NOT NULL,
    car_park_no TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS index_email_address
ON user_car_parks(email_address);
