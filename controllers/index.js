const { createUser, getUsers } = require("./user.controller");
const {
  saveDownloadHistory,
  getUsersClickCount,
} = require("./history.controller");

module.exports = {
  createUser,
  getUsers,
  saveDownloadHistory,
  getUsersClickCount,
};
