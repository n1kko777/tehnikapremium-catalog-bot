const { Telegraf } = require("telegraf");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

const { scrapeCurrency } = require("../currency");
const { scrapeSite } = require("../parser");

const token = process.env.BOT_TOKEN;

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);

const setup = () => {
  bot.use(Telegraf.log());

  bot.start((ctx) => {
    ctx.reply(`Доступные команды:
/download - скачать прайс-лист
/currency - текущий курс
/update - обновить прайс-лист`);
  });

  bot.command("download", (ctx) => {
    const files = fs.readdirSync("./files");
    const xlsxFile = files.find((file) => file.endsWith(".xlsx"));

    if (xlsxFile) {
      ctx.replyWithDocument({ source: `./files/${xlsxFile}` });
    } else {
      ctx.reply('No xlsx files found in the "files" folder.');
    }
  });
  bot.command("currency", async (ctx) => {
    const { message_id } = await ctx.reply("Загрузка...");
    const currency = await scrapeCurrency();
    ctx.deleteMessage(message_id);
    ctx.reply(`Курс: ${currency}`);
  });
  bot.command("update", async (ctx) => {
    const { message_id } = await ctx.reply("Загрузка...");
    const currency = await scrapeCurrency();
    await scrapeSite(currency);
    await ctx.deleteMessage(message_id);
    return ctx.reply(`Прайс-лист обновлен!`);
  });

  return bot;
};

module.exports = {
  setup,
};
