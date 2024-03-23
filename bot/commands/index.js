const { downloadMiele } = require("./downloadMiele");
const { clearFolder } = require("./clearFolder");
const { start } = require("./start");
const { currency } = require("./currency");
const { update } = require("./update");
const { startUpdateCron, stopUpdateCron } = require("./cron");
const { service } = require("./service");
const { contacts } = require("./contacts");
const { users } = require("./users");
const { statistics } = require("./statistics");

module.exports = {
  downloadMiele,
  clearFolder,
  start,
  update,
  currency,
  startUpdateCron,
  stopUpdateCron,
  service,
  contacts,
  users,
  statistics,
};
