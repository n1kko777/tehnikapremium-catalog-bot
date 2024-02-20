const { Telegraf } = require("telegraf");
const dotenv = require("dotenv");

dotenv.config();

const {
  downloadMiele,
  start,
  currency,
  update,
  startUpdateCron,
  stopUpdateCron,
  service,
  contacts,
  users,
  clearFolder,
} = require("./commands");

const token = process.env.BOT_TOKEN;

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);

const setup = () => {
  bot.use(Telegraf.log());

  bot.start(async (ctx) => await start(ctx));
  bot.command("download", downloadMiele);
  bot.command("service", service);
  bot.command("contacts", contacts);

  bot.action("downloadMiele", async (ctx) => await downloadMiele(ctx, bot));

  // admin
  bot.command("currency", async (ctx) => await currency(ctx));
  bot.command("update", async (ctx) => await update(ctx, bot));
  bot.command(
    "startUpdateCron",
    async (ctx) => await startUpdateCron(ctx, bot)
  );
  bot.command("stopUpdateCron", stopUpdateCron);
  bot.command("users", async (ctx) => await users(ctx, bot));
  bot.command("clearFolder", clearFolder);

  return bot;
};

module.exports = {
  setup,
};
