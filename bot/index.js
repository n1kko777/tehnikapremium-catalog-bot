const { Telegraf } = require("telegraf");
const dotenv = require("dotenv");

dotenv.config();

const { downloadMiele, start, currency, update } = require("./commands");

const token = process.env.BOT_TOKEN;

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);

const setup = () => {
  bot.use(Telegraf.log());

  bot.start(start);
  bot.command("download", downloadMiele);
  bot.command("currency", async (ctx) => await currency(ctx));
  bot.command("update", async (ctx) => await update(ctx, bot));

  bot.action("downloadMiele", (ctx) => downloadMiele(ctx, bot));

  return bot;
};

module.exports = {
  setup,
};
