const fs = require("fs");

const { createUser, saveDownloadHistory } = require("../../controllers");

const ADMIN_ID = process.env.ADMIN_ID;

const downloadCatalogs = async (ctx) => {
  const user = ctx?.update?.callback_query?.from || ctx?.message?.from;

  await createUser(user);

  const files = fs.readdirSync("./files/catalogs");

  if (!files.length) {
    try {
      if (ADMIN_ID?.toString() !== user?.id?.toString()) {
        ctx.telegram.sendMessage(
          ADMIN_ID,
          "Не удалось найти файлы для скачивания!"
        );
      }
    } catch (error) {}

    return ctx.reply(
      "Не удалось найти файлы для скачивания. Уже написали админам."
    );
  }

  files.forEach(async (xlsxFile) => {
    try {
      if (user?.id?.toString() !== ADMIN_ID?.toString()) {
        await saveDownloadHistory(user?.id);
      }
    } catch (error) {}

    await ctx.replyWithDocument({ source: `./files/catalogs/${xlsxFile}` });
  });
};

module.exports = { downloadCatalogs };
