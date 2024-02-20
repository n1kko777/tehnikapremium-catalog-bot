const { readdirSync, rmSync } = require("fs");
const path = require("path");
const dir = __dirname + "/../../files";

const ADMIN_ID = process.env.ADMIN_ID;

const clearFolder = async (ctx, bot) => {
  if (ADMIN_ID?.toString() === ctx.message.from.id?.toString()) {
    readdirSync(dir, { withFileTypes: true }).forEach((f) => {
      if (f.isFile()) rmSync(path.join(dir, f.name));
    });

    ctx.reply("Файлы удалены");
  }
};

module.exports = { clearFolder };
