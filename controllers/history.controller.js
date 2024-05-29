const { Op } = require("sequelize");
const moment = require("moment");

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

const getDateRange = (key) => {
  switch (key) {
    case "today":
      return {
        start: moment().startOf("day").toDate(),
        end: moment().endOf("day").toDate(),
      };
    case "yesterday":
      return {
        start: moment().subtract(1, "days").startOf("day").toDate(),
        end: moment().subtract(1, "days").endOf("day").toDate(),
      };
    case "week":
      return {
        start: moment().startOf("isoWeek").toDate(),
        end: moment().endOf("isoWeek").toDate(),
      };
    case "month":
      return {
        start: moment().startOf("month").toDate(),
        end: moment().endOf("month").toDate(),
      };
    default:
      return null;
  }
};

const getUsersClickCount = async (period = "all") => {
  try {
    const users = await User.findAll();
    const dateRange = getDateRange(period);

    if (dateRange) {
      const { start, end } = dateRange;

      return await Promise.all(
        users.map(async (user) => {
          const clickCount = await History.count({
            where: {
              userId: user.id,
              updatedAt: {
                [Op.between]: [start, end],
              },
            },
          });
          return {
            user,
            clickCount,
          };
        })
      );
    }

    return await Promise.all(
      users.map(async (user) => {
        const clickCount = await History.count({
          where: {
            userId: user.id,
          },
        });
        return {
          user,
          clickCount,
        };
      })
    );
  } catch (error) {
    console.error("getUsersClickCount:", error);
  }
};

module.exports = { saveDownloadHistory, getUsersClickCount };
