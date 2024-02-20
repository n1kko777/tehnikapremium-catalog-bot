const fs = require("fs");

const { createUser } = require("../../controllers");

const ADMIN_ID = process.env.ADMIN_ID;

const downloadMiele = async (ctx, bot) => {
  const user = ctx?.update?.callback_query?.from || ctx?.message?.from;

  await createUser(user);

  const files = fs.readdirSync("./files");
  const xlsxFile =
    files.find(
      (file) =>
        file.includes(new Date().toLocaleDateString("ru-RU")) &&
        file.endsWith(".xlsx")
    ) || files.filter((file) => file.endsWith(".xlsx")).pop();

  if (xlsxFile) {
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
