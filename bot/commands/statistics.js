const { getUsersClickCount } = require("../../controllers");
const { getUserInfo } = require("../utils");

const ADMIN_ID = process.env.ADMIN_ID;

// Функция для сортировки массива объектов по полю clickCount от большего к меньшему
function sortItemsByClickCountDescending(a, b) {
  return b.clickCount - a.clickCount; // Сортировка от большего к меньшему
}

const statistics = async (ctx, bot) => {
  if (ADMIN_ID?.toString() === ctx.message.from.id?.toString()) {
    const { message_id } = await ctx.reply("Загрузка...");
    const users = await getUsersClickCount();
    const userList = users
      .filter(({ user }) => user?.id?.toString() !== ADMIN_ID?.toString())
      .sort(sortItemsByClickCountDescending)
      .map(({ user, clickCount }) => `- ${getUserInfo(user)} (${clickCount})`)
      .join("\n");
    ctx.deleteMessage(message_id);
    ctx.reply(`Статистика скачивания:\n\n${userList}`);
  }
};

module.exports = { statistics };
