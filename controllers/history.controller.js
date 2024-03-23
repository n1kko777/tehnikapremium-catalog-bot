const { History, User } = require("../models");

async function saveDownloadHistory(userId) {
  try {
    await History.create({
      userId,
    });
  } catch (error) {
    console.error("saveDownloadHistory", error);
  }
}

const getUsersClickCount = async () => {
  try {
    const users = await User.findAll();

    const usersClickCount = await Promise.all(
      users.map(async (user) => {
        const clickCount = await History.count({
          where: { userId: user.id },
        });
        return {
          user,
          clickCount,
        };
      })
    );

    return usersClickCount;
  } catch (error) {
    console.error("getUsersClickCount:", error);
  }
};

module.exports = { saveDownloadHistory, getUsersClickCount };
