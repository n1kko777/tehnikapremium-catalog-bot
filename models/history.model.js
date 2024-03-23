const Sequelize = require("sequelize");
const sequelize = require("../database");

const History = sequelize.define("history", {
  userId: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
});

module.exports = { History };
