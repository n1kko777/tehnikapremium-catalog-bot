const { yadisk } = require("../../yadisk");

const ADMIN_ID = process.env.ADMIN_ID;
const MANAGER_IDS =
  process.env.MANAGER_ID?.split(",")?.map((id) => id.toString()) || [];

const files = async (ctx) => {
  const user = ctx?.update?.callback_query?.from || ctx?.message?.from;

  if (MANAGER_IDS.includes(user.id?.toString())) {
    const { message_id } = await ctx.reply("Запущен процесс обновления...");

    const onReply = async (text) => {
      await ctx.deleteMessage(message_id);
      await ctx.reply(text);

      if (ADMIN_ID !== user?.id?.toString()) {
        await ctx.telegram.sendMessage(ADMIN_ID, text);
      }
    };

    await yadisk(onReply);
  }
};

module.exports = { files };
