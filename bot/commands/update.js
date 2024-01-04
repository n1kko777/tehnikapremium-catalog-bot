const { startWorker } = require("../utils");

const ADMIN_ID = process.env.ADMIN_ID;

const update = async (ctx, bot) => {
  if (ADMIN_ID?.toString() === ctx.message.from.id?.toString()) {
    ctx.reply("Запущен процесс парсинга...");

    startWorker(__dirname + "/../../parser.js", (err, result) => {
      if (err) {
        bot.telegram.sendMessage(
          ADMIN_ID,
          `Ошибка парсера: ${err || "Неопределенная ошибка"}`
        );
        return console.error(err);
      }

      bot.telegram.sendMessage(ADMIN_ID, "Прайс-лист обновлен!");

      if (result) {
        bot.telegram.sendMessage(ADMIN_ID, result?.toString());
      }
    });
  }
};

module.exports = { update };
