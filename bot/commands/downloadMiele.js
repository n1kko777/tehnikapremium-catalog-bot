const fs = require("fs");

const { createUser, saveDownloadHistory } = require("../../controllers");

const ADMIN_ID = process.env.ADMIN_ID;

const downloadMiele = async (ctx) => {
  const user = ctx?.update?.callback_query?.from || ctx?.message?.from;

  await createUser(user);

  const files = fs.readdirSync("./files");

  let xlsxFile = null;
  const today = new Date();

  // Check for files from today and the past 6 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const formattedDate = date.toLocaleDateString("ru-RU");
    const foundFile = files
      .filter((file) => file.endsWith(".xlsx"))
      .find((file) => file.includes(formattedDate));

    if (foundFile) {
      xlsxFile = foundFile;
      break;
    }
  }

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
