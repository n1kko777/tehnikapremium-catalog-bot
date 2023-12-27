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
      `tehnikapremium.ru — интернет магазин бытовой техники

Телеграм бот формирует актуальный прайс лист от представительства Miele в Казахстане с учётом наличия техники и текущего курса рубля к теньге.

Поставляемая техника Miele, полностью русифицирована и имеет русскоязычные инструкции, официальную гарантию 1 год на территории Казахстана, которую мы транслируем на территории РФ.

Срок поставки в РФ 1 месяц, говорит о том что позиция есть в наличии на складе в Казахстане.
Срок поставки в РФ 2 месяца, говорит что товар в пути и вскоре будет в Казахстане. 
Соответственно более 2ух месяцев, нет на складе.

Оплата наличный расчет или перевод на карту Сбербанка.
Безналичный расчет с НДС в проработке, добавляет к стоимости 21% и срок +2 недели.`,
      inlineButtonConfig
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
