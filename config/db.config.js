const dotenv = require("dotenv");
dotenv.config();

const HOST = process.env.PGHOST;
const PORT = process.env.PGPORT;
const USER = process.env.PGUSER;
const PASSWORD = process.env.PGPASSWORD;
const DB = process.env.PGDATABASE;
const dialect = "postgres";
const pool = {
  max: 5,
  min: 0,
  acquire: 30000,
  idle: 10000,
};

module.exports = {
  HOST,
  PORT,
  USER,
  PASSWORD,
  DB,
  dialect,
  pool,
};
