const { User } = require("../models");

async function createUser(user) {
  try {
    const result = await User.findAll({ where: { id: user.id } });

    if (result.length === 0) {
      await User.create({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        language_code: user.language_code,
      });
    }
  } catch (error) {
    console.error("createUser", error);
  }
}

module.exports = { createUser };
