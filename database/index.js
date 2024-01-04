const Sequelize = require("sequelize");
const dbConfig = require("../config/db.config.js");

module.exports = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  port: dbConfig.PORT,
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: dbConfig.pool,
  logging: console.log,
});
