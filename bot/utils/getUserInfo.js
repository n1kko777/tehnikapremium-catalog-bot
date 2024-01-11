const getUserInfo = ({ username, first_name, last_name, id }) => {
  if (first_name && last_name && username)
    return `${first_name} ${last_name} (@${username})`;
  if (first_name && username) return `${first_name} (@${username})`;
  if (first_name) return `${first_name} (${id})`;
  if (username) return `@${username}`;
  return id;
};

module.exports = { getUserInfo };
