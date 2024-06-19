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
const { broadcast } = require("./broadcast");
const { files } = require("./files");
const { downloadPrices } = require("./downloadPrices");
const { downloadCatalogs } = require("./downloadCatalogs");

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
  broadcast,
  files,
  downloadPrices,
  downloadCatalogs,
};
