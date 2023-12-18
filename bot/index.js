const { Telegraf, Markup } = require("telegraf");
const dotenv = require("dotenv");

const fs = require("fs");

dotenv.config();

const { scrapeCurrency } = require("../currency");

const { Worker } = require("worker_threads");

function startWorker(path, cb) {
  let w = new Worker(path, { workerData: null });
  w.on("message", (msg) => {
    cb(null, msg);
  });
  w.on("error", cb);
  w.on("exit", (code) => {
    if (code != 0)
      console.error(new Error(`Worker stopped with exit code ${code}`));
  });
  return w;
}

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

  bot.start((ctx) => {
    ctx.reply(
      `Салон Premium | Бытовая техника для кухни и прачечной.

Нужна бытовая техника из видео? Закажите её на нашем сайте tehnikapremium.ru.

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

  const downloadMiele = (ctx) => {
    const files = fs.readdirSync("./files");
    const xlsxFile = files.find(
      (file) =>
        file.includes(new Date().toLocaleDateString("ru-RU")) &&
        file.endsWith(".xlsx")
    );

    if (xlsxFile) {
      ctx.replyWithDocument({ source: `./files/${xlsxFile}` });
    } else {
      ctx.reply("Не удалось найти файл для скачивания. Уже написали админам.");
      bot.telegram.sendMessage(
        ADMIN_ID,
        "Не удалось найти файл для скачивания!"
      );
    }
  };

  bot.command("download", downloadMiele);
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
          bot.telegram.sendMessage(ADMIN_ID, `Ошибка загрузки: ${err}`);
          return console.error(err);
        }

        bot.telegram.sendMessage(ADMIN_ID, "Прайс-лист обновлен!");
      });
    }
  });

  bot.action("downloadMiele", downloadMiele);

  return bot;
};

module.exports = {
  setup,
};
