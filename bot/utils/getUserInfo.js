const getUserInfo = ({ username, first_name, id }) => {
  if (username) return username;

  if (first_name) return `${first_name} (${id})`;

  return id;
};

module.exports = { getUserInfo };
