const Fastify = require("fastify");
const dotenv = require("dotenv");
dotenv.config();

const { setup } = require("./bot");

const { URL: WEBHOOK_URL, ADMIN_ID, NODE_ENV } = process.env;
const PORT = process.env.PORT || 3000;

if (!WEBHOOK_URL) throw new Error('"WEBHOOK_URL" env var is required!');

const initialize = async () => {
  const fastify = Fastify();

  const bot = setup();

  const SECRET_PATH = `/telegraf/${bot.secretPathComponent()}`;

  fastify.post(SECRET_PATH, (req, rep) => bot.handleUpdate(req.body, rep.raw));

  if (NODE_ENV === "development") {
    bot.launch();
  } else {
    bot.telegram.setWebhook(WEBHOOK_URL + SECRET_PATH).then(() => {
      console.log("Webhook is set on", WEBHOOK_URL);
    });
  }

  bot.catch((error) => {
    console.log("error", error);
    bot.telegram.sendMessage(ADMIN_ID, `Error executing a command: ${error}`);
  });

  try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" }).then(() => {
      console.log("Listening on port", PORT);
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

initialize();
