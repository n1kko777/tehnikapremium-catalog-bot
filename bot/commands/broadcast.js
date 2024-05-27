const { getUsers } = require("../../controllers");

const ADMIN_ID = process.env.ADMIN_ID;

const broadcast = async (ctx) => {
  if (ADMIN_ID?.toString() === ctx.message.from.id?.toString()) {
    const users = await getUsers();
    const usersIds = users.map((user) => user.id);

    const message = ctx.message.text?.split("/notify ")?.[1];

    console.log("message", message);

    if (!message) {
      ctx.reply(
        "Напишите сообщение, которое будет отправлено в виде /notify <текст>"
      );
    }

    usersIds.forEach(async (subscriber) => {
      try {
        await ctx.telegram.sendMessage(subscriber, message);
      } catch (error) {
        await ctx.telegram.sendMessage(
          ADMIN_ID,
          "Не удалось отправить сообщение пользователю " +
            subscriber +
            ":\n" +
            error
        );
      }
    });
  }
};

module.exports = { broadcast };
