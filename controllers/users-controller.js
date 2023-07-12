const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
let { getUserList, saveUserList } = require('../helpers/get-user-list');
const { validationResult } = require('express-validator');
const { secret } = require('../config');

class UsersController {
  async listUsers(req, res) {
    try {
      if (!req.headers?.authorization) {
        return res.status(403).json({ message: 'User is not authorized' });
      }

      const token = req.headers?.authorization.split(' ')[1];
      const { role: userRole, id: userId } = jwt.verify(token, secret);

      let userListInJson = await getUserList();
      let userList = JSON.parse(userListInJson);

      switch (userRole) {
        case 'boss':
          let candidates = [];
          let user = userList.find((user) => user.id === userId);
          let searchForCandidates = (user) => {
            if (!user.subordinateIdList?.length) {
              return;
            } else {
              candidates = [...candidates, ...user.subordinateIdList];
              user.subordinateIdList.forEach((id) => {
                searchForCandidates(userList.find((user) => user.id === id));
              });
            }
          };
          searchForCandidates(user);
          candidates = [...new Set(candidates)];
          userList = userList.filter((user) => candidates.includes(user.id) || user.id === userId);
          break;
        case 'worker':
          userList = userList.filter((user) => user.id == userId);
          break;
      }

      return res.json(userList);
    } catch (e) {
      res.status(400).json({ message: 'Error during listing users', error: e });
    }
  }

  async changeUsersBoss(req, res) {
    try {
      if (!req.headers?.authorization) {
        return res.status(403).json({ message: 'User is not authorized' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid data' });
      }

      const token = req.headers?.authorization.split(' ')[1];
      const { role: userRole, id: userId } = jwt.verify(token, secret);
      const { workerId, newBossId } = req.body;

      let userListInJson = await getUserList();
      let userList = JSON.parse(userListInJson);

      let oldBoss = userList.find((user) => user.id === userId);
      let newBoss = userList.find((user) => user.id === newBossId);
      let worker = userList.find((user) => user.id === workerId);

      if (userRole === 'worker') {
        return res.status(400).json({ message: 'Only boss are able to change roles' });
      }

      let candidates = [];
      let searchForCandidates = (user) => {
        if (!user.subordinateIdList?.length) {
          return;
        } else {
          candidates = [...candidates, ...user.subordinateIdList];
          user.subordinateIdList.forEach((id) => {
            searchForCandidates(userList.find((user) => user.id === id));
          });
        }
      };
      searchForCandidates(oldBoss);
      candidates = [...new Set(candidates)];

      if (!candidates.includes(worker.id)) {
        return res.status(400).json({ message: 'User is not your subordinate' });
      }

      console.log(newBoss, worker, oldBoss);

      userList = userList.map((user) => {
        if (user.id === newBoss.id) {
          user.subordinateIdList.push(worker.id);
        } else if (user.id === oldBoss.id) {
          user.subordinateIdList = user.subordinateIdList.filter((id) => id !== worker.id);
        } else if (user.id === worker.id) {
          user.bossId = newBoss.id;
        }
        return user;
      });

      await saveUserList(JSON.stringify(userList));
      return res.json({ message: 'Boss was updated successfully' });
    } catch (e) {
      res.status(400).json({ message: 'Error during changing user boss', error: e });
    }
  }
}

module.exports = new UsersController();
