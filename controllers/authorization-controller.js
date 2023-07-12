const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
let { getUserList, saveUserList } = require('../helpers/get-user-list');
const { validationResult } = require('express-validator');
const { secret } = require('../config');

const generateToken = (id, role) => {
  const payload = {
    id,
    role,
  };
  return jwt.sign(payload, secret, { expiresIn: '24h' });
};

class AuthorizationController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      let userList = await getUserList();
      let parsedList = JSON.parse(userList);

      const user = parsedList.find((user) => user.email == email);
      if (!user) {
        return res.status(400).json({ message: 'User was not found' });
      }
      const isValidPassword = bcryptjs.compareSync(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      const token = generateToken(user.id, user.role);
      return res.json({ token });
    } catch (e) {
      res.status(400).json({ message: 'Error during login' });
    }
  }

  async registration(req, res) {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid data' });
      }
      const { email, name, surname, password, role, bossId, subordinateIdList } = req.body;
      let userList = await getUserList();
      let parsedList = JSON.parse(userList || '[]');

      const candidate = parsedList.find((user) => user.email == email);
      if (candidate) {
        return res.status(400).json({ message: 'Email is already registered' });
      }

      const hashedPassword = bcryptjs.hashSync(password, 7);
      const user = {
        id: Math.random().toString(16).slice(2),
        email,
        name,
        surname,
        password: hashedPassword,
        role,
      };

      if (role === 'boss' && !subordinateIdList?.length) {
        return res.status(400).json({ message: 'Boss should have at least one subordinate' });
      } else if (role === 'boss') {
        for (let i = 0; i < subordinateIdList.length; i++) {
          let subordinate = parsedList.find((subordinate) => subordinateIdList[i] === subordinate.id);
          if (!subordinate) {
            return res.status(400).json({ message: 'Subordinate does not exist' });
          } else if (subordinate.bossId && subordinate.role !== 'admin') {
            return res.status(400).json({ message: 'Some of subordinates already has boss' });
          }
        }
        user.subordinateIdList = subordinateIdList;
      }

      if (role === 'worker' && bossId) {
        let boss = parsedList.find((boss) => bossId === boss.id);
        if (!boss) {
          return res.status(400).json({ message: 'No boss with given id was found' });
        }
        parsedList = parsedList.map((boss) => {
          if (bossId === boss.id) {
            boss.subordinateIdList.push(user.id);
          }
          return boss;
        });
      }

      if (bossId) {
        user.bossId = bossId;
      }

      await saveUserList(JSON.stringify([...parsedList, user]));

      return res.json({ message: 'User has been created' });
    } catch (e) {
      res.status(400).json({ message: 'Error during registration', error: e });
    }
  }

  async getUsers(req, res) {
    try {
      res.json('sdsd');
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = new AuthorizationController();
