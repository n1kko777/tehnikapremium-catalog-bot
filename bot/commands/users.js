const { getUsers } = require("../../controllers");
const { getUserInfo } = require("../utils");

const ADMIN_ID = process.env.ADMIN_ID;

const users = async (ctx) => {
  if (ADMIN_ID?.toString() === ctx.message.from.id?.toString()) {
    const { message_id } = await ctx.reply("Загрузка...");
    const users = await getUsers();
    const userList = users.map((user) => `- ${getUserInfo(user)}`).join("\n");
    ctx.deleteMessage(message_id);
    ctx.reply(`Пользователи:\n\n${userList}`);
  }
};

module.exports = { users };
