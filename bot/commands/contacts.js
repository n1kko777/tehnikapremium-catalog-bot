const { Markup } = require("telegraf");

const inlineButtonConfig = {
  parse_mode: "HTML",
  ...Markup.inlineKeyboard([
    [
      Markup.button.url(
        "Офис в Москве",
        "https://tehnikapremium.ru/contacts/stores/47028/"
      ),
    ],
    [
      Markup.button.url(
        "Офис в Екатеринбурге",
        "https://tehnikapremium.ru/contacts/stores/20836/"
      ),
    ],
    [
      Markup.button.url(
        "Офис в Тюмени",
        "https://tehnikapremium.ru/contacts/stores/20927/"
      ),
    ],
    [Markup.button.url("Написать в What's app", "https://wa.me/79028700244")],
  ]),
};

const contacts = (ctx) => {
  ctx.reply(
    `Приходите в наши салоны в Москве, Екатеринбурге и Тюмени:

📍 Москва
шоссе Энтузиастов, 3к2
+74954774032

📍 Екатеринбург
Московская, 77
Цвиллинга, 1
+73432385000

📍 Тюмень
50 лет Октября, 57Б
+73452579150

<b>☎️ Консультация по вопросам поставки техники Miele</b>
+79028700244 (Бабинов Сергей)`,
    inlineButtonConfig
  );
};

module.exports = { contacts };
