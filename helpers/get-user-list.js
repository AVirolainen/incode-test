let fs = require('fs').promises;

let getUserList = async () => {
  return await fs.readFile(__dirname + '/../db/' + 'users.json', 'utf8');
};

let saveUserList = async (content) => {
  return await fs.writeFile(__dirname + '/../db/' + 'users.json', content);
};

module.exports = { getUserList, saveUserList };
