const fs = require("fs");

const { createUser, saveDownloadHistory } = require("../../controllers");

const ADMIN_ID = process.env.ADMIN_ID;

const downloadMiele = async (ctx) => {
  const user = ctx?.update?.callback_query?.from || ctx?.message?.from;

  await createUser(user);

  const files = fs.readdirSync("./files");
  const xlsxFile =
    files
      .filter((file) => file.endsWith(".xlsx"))
      .find((file) => file.includes(new Date().toLocaleDateString("ru-RU"))) ||
    files.filter((file) => file.endsWith(".xlsx")).pop();

  if (xlsxFile) {
    try {
      if (user?.id?.toString() !== ADMIN_ID?.toString()) {
        await saveDownloadHistory(user?.id);
      }
    } catch (error) {}
    return ctx.replyWithDocument({ source: `./files/${xlsxFile}` });
  } else {
    try {
      if (ADMIN_ID?.toString() !== user?.id?.toString()) {
        ctx.telegram.sendMessage(
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
