const dotenv = require("dotenv");
dotenv.config();

const fs = require("fs");

const { getUserInfo } = require("../utils");

const ADMIN_ID = process.env.ADMIN_ID;

const downloadMiele = (ctx, bot) => {
  const user = ctx?.update?.callback_query?.from || ctx?.message?.from;

  const files = fs.readdirSync("./files");
  const xlsxFile =
    files.find(
      (file) =>
        file.includes(new Date().toLocaleDateString("ru-RU")) &&
        file.endsWith(".xlsx")
    ) || files.filter((file) => file.endsWith(".xlsx")).pop();

  if (xlsxFile) {
    try {
      if (ADMIN_ID?.toString() !== user?.id?.toString()) {
        const cred = getUserInfo(user);

        bot.telegram.sendMessage(
          ADMIN_ID,
          `Пользователь: ${cred} только что скачал файл`
        );
      }
    } catch (error) {}

    return ctx.replyWithDocument({ source: `./files/${xlsxFile}` });
  } else {
    try {
      if (ADMIN_ID?.toString() !== user?.id?.toString()) {
        bot.telegram.sendMessage(
          ADMIN_ID,
          "Не удалось найти файл для скачивания!"
        );
      }
    } catch (error) {}

    return ctx.reply(
      "Не удалось найти файл для скачивания. Уже написали админам."
    );
  }
};

module.exports = { downloadMiele };
