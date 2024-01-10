const { Markup } = require("telegraf");
const { createUser } = require("../../controllers");

const inlineButtonConfig = {
  parse_mode: "HTML",
  ...Markup.inlineKeyboard([
    [Markup.button.url("Посетить сайт", "https://tehnikapremium.ru/")],
    [Markup.button.callback("Скачать прайс-лист Miele", "downloadMiele")],
  ]),
};

const start = async (ctx) => {
  const user = ctx.from;

  await createUser(user);

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
};

module.exports = { start };
