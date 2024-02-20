const Sequelize = require("sequelize");
const sequelize = require("../database");

const User = sequelize.define("user", {
  id: {
    type: Sequelize.BIGINT,
    primaryKey: true,
  },
  first_name: {
    type: Sequelize.STRING,
  },
  last_name: {
    type: Sequelize.STRING,
  },
  username: {
    type: Sequelize.STRING,
  },
  language_code: {
    type: Sequelize.STRING,
  },
  role: {
    type: Sequelize.ENUM("admin", "staff", "user"),
    defaultValue: "user",
  },
});

module.exports = { User };
