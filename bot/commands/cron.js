const schedule = require("node-schedule");

const { update } = require("./update");

let notificationJob = null;

const { ADMIN_ID } = process.env;

const startUpdateCron = async (ctx, bot) => {
  if (ADMIN_ID?.toString() === ctx.message.from.id?.toString()) {
    if (notificationJob !== null) {
      ctx.reply("Cron /update остановлен");
      notificationJob.cancel();
    }

    notificationJob = schedule.scheduleJob(
      `0 2 * * *`,
      async () => await update(ctx, bot)
    );
    ctx.reply("Cron /update запущен");
  }
};

const stopUpdateCron = async (ctx) => {
  if (ADMIN_ID?.toString() === ctx.message.from.id?.toString()) {
    if (notificationJob !== null) {
      ctx.reply("Cron /update остановлен");
      notificationJob.cancel();
    } else {
      ctx.reply("Cron /update не запущен");
    }
  }
};

module.exports = {
  startUpdateCron,
  stopUpdateCron,
};
