const Fastify = require("fastify");

const dotenv = require("dotenv");
dotenv.config();

const db = require("./database");
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
      bot.telegram.sendMessage(ADMIN_ID, "Бот был перезапущен!");
      console.log("Listening on port", PORT);
    });
  } catch (err) {
    fastify.log.error(err);
    const errorMsg = `Error fastify: ${err}`.substring(0, 4096);
    bot.telegram.sendMessage(ADMIN_ID, errorMsg);
    process.exit(1);
  }
};

db.authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
    console.log("Creating tables ===================");
    db.sync()
      .then(() => {
        console.log("=============== Tables created per model");
        initialize();
      })
      .catch((err) => {
        console.error("Unable to create tables:", err);
      });
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });
