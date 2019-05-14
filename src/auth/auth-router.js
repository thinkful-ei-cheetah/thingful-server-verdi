'use strict';

const express = require('express');
const authRouter = express.Router();
const bodyParser = express.json();
const AuthService = require('./auth-service');

authRouter
  .route('/login')
  .post(bodyParser, async (req, res, next) => {
    const {user_name, password} = req.body;
    const loginUser = {user_name, password};
    
    for (const [key, value] of Object.entries(loginUser)) {
      if (!value) {
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        });
      }
    }

    try {
      const user = await AuthService.findByUsername(req.app.get('db'), loginUser.user_name);
      if (!user) {
        return res.status(400).json({
          error: 'Incorrect user_name or password',
        });
      }

      const passwordsMatch = await AuthService.comparePasswords(loginUser.password, user.password);

      if (!passwordsMatch) {
        return res.status(400).json({
          error: 'Incorrect user_name or password',
        });
      }

      const sub = user.user_name;
      const payload = { user_id: user.id };
      res.send({
        authToken: AuthService.createJwt(sub, payload),
      });
    } catch(err) {
      next(err);
    }
    
  });

module.exports = authRouter;