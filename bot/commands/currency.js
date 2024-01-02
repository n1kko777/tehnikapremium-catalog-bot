const { scrapeCurrency } = require("../../currency");

const dotenv = require("dotenv");
dotenv.config();

const ADMIN_ID = process.env.ADMIN_ID;

const currency = async (ctx) => {
  if (ADMIN_ID?.toString() === ctx.message.from.id?.toString()) {
    const { message_id } = await ctx.reply("Загрузка...");
    const currency = await scrapeCurrency();
    ctx.deleteMessage(message_id);
    ctx.reply(`Курс: ${currency}`);
  }
};

module.exports = { currency };
