let express = require('express');
let authorizationController = require('./controllers/authorization-controller');
let usersController = require('./controllers/users-controller');
const { check } = require('express-validator');

let app = express();
app.use(express.json());

app.get('/listUsers', usersController.listUsers);
app.post('/changeBoss', [check('workerId').notEmpty(), check('newBossId').notEmpty()], usersController.changeUsersBoss);

app.post(
  '/registration',
  [
    check('email').notEmpty(),
    check('name').notEmpty(),
    check('surname').notEmpty(),
    check('password').isLength({ min: 4, max: 15 }),
    check('role').isIn(['admin', 'boss', 'worker']),
  ],
  authorizationController.registration
);
app.post('/login', authorizationController.login);

let server = app.listen(8081, function () {
  let port = server.address().port;
  console.log('Example app listening at %s', port);
});
