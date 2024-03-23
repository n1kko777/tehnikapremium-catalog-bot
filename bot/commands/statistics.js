const { getUsersClickCount } = require("../../controllers");
const { getUserInfo } = require("../utils");

const ADMIN_ID = process.env.ADMIN_ID;

const statistics = async (ctx, bot) => {
  if (ADMIN_ID?.toString() === ctx.message.from.id?.toString()) {
    const { message_id } = await ctx.reply("Загрузка...");
    const users = await getUsersClickCount();
    const userList = users
      .filter(({ user }) => user?.id?.toString() !== ADMIN_ID?.toString())
      .map(({ user, clickCount }) => `- ${getUserInfo(user)} (${clickCount})`)
      .join("\n");
    ctx.deleteMessage(message_id);
    ctx.reply(`Статистика скачивания:\n\n${userList}`);
  }
};

module.exports = { statistics };
