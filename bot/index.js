const { Telegraf, Markup } = require("telegraf");
const dotenv = require("dotenv");

const fs = require("fs");

dotenv.config();

const { scrapeCurrency } = require("../currency");

const { startWorker, getUserInfo } = require("./utils");

const token = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

if (token === undefined) {
  throw new Error("BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);

const inlineButtonConfig = {
  parse_mode: "HTML",
  ...Markup.inlineKeyboard([
    [Markup.button.callback("Скачать прайс-лист Miele", "downloadMiele")],
  ]),
};

const setup = () => {
  bot.use(Telegraf.log());

  const downloadMiele = (ctx) => {
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

  bot.command("download", downloadMiele);

  bot.start((ctx) => {
    ctx.reply(
      `Салон Premium | Бытовая техника для кухни и прачечной.

Нужна бытовая техника? Закажите её на нашем сайте tehnikapremium.ru.

Приходите в наши салоны в Москве, Екатеринбурге и Тюмени:

Москва
шоссе Энтузиастов, 3к2
(495) 477-40-32

Екатеринбург
Московская, 77
Цвиллинга, 1
(343) 238-50-00

Тюмень
50 лет Октября, 57Б
(3452) 57-91-50`,
      inlineButtonConfig
    );
  });

  bot.command("info", (ctx) => {
    ctx.reply(
      `Возможности бота:
/start - информационнй пост
/info - получить информацию о функционале
/download - скачать прайс-лист Miele`
    );
  });

  bot.command("currency", async (ctx) => {
    if (ADMIN_ID?.toString() === ctx.message.from.id?.toString()) {
      const { message_id } = await ctx.reply("Загрузка...");
      const currency = await scrapeCurrency();
      ctx.deleteMessage(message_id);
      ctx.reply(`Курс: ${currency}`);
    }
  });
  bot.command("update", async (ctx) => {
    if (ADMIN_ID?.toString() === ctx.message.from.id?.toString()) {
      ctx.reply("Запущен процесс парсинга...");

      startWorker(__dirname + "/../parser.js", (err, result) => {
        if (err) {
          bot.telegram.sendMessage(
            ADMIN_ID,
            `Ошибка парсера: ${err || "Неопределенная ошибка"}`.substring(400)
          );
          return console.error(err);
        }

        bot.telegram.sendMessage(ADMIN_ID, "Прайс-лист обновлен!");

        if (result) {
          bot.telegram.sendMessage(ADMIN_ID, result?.toString());
        }
      });
    }
  });

  bot.action("downloadMiele", downloadMiele);

  return bot;
};

module.exports = {
  setup,
};
