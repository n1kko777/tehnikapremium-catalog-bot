const { Markup } = require("telegraf");
const { getUsersClickCount } = require("../../controllers");
const { getUserInfo } = require("../utils");

const ADMIN_ID = process.env.ADMIN_ID;

const inlineButtonConfig = {
  parse_mode: "HTML",
  ...Markup.inlineKeyboard([
    [Markup.button.callback("Сегодня", "statToday")],
    [Markup.button.callback("Вчера", "statYesterday")],
    [Markup.button.callback("Неделя", "statWeek")],
    [Markup.button.callback("Месяц", "statMonth")],
  ]),
};
// Функция для сортировки массива объектов по полю clickCount от большего к меньшему
function sortItemsByClickCountDescending(a, b) {
  return b.clickCount - a.clickCount; // Сортировка от большего к меньшему
}

const statistics = async (ctx, period = "all") => {
  const fromUser = ctx?.update?.callback_query?.from || ctx?.message?.from;

  if (ADMIN_ID?.toString() === fromUser?.id?.toString()) {
    const messageId =
      ctx?.update?.callback_query?.message?.message_id ||
      ctx?.message?.message_id;

    if (messageId) {
      ctx.deleteMessage(messageId);
    }

    const { message_id } = await ctx.reply("Загрузка...");
    const users = (await getUsersClickCount(period)) || [];

    const userList = users
      .filter(({ user }) => user?.id?.toString() !== ADMIN_ID?.toString())
      .sort(sortItemsByClickCountDescending)
      .map(({ user, clickCount }) => `- ${getUserInfo(user)} (${clickCount})`)
      .join("\n");
    ctx.deleteMessage(message_id);
    ctx.reply(
      `Статистика скачивания (${period}):\n\n${userList}`,
      inlineButtonConfig
    );
  }
};

module.exports = { statistics };
