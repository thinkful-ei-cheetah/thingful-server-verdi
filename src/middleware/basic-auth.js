'use strict';
const bcrypt = require('bcryptjs');
const AuthService = require('../auth/auth-service');

const requireAuth = async (req, res, next) => {
  const authToken = req.get('Authorization') || '';
  let token;

  if (!authToken.toLowerCase().startsWith('basic ')) {
    return res.status(401).json({ error: 'Missing basic token' });
  } else {
    token = authToken.slice('basic '.length, authToken.length);
  }
  
  const [user_name, password] = AuthService.parseBasicToken(token);

  if (!user_name || !password) {
    return res.status(401).json({ error: 'Unauthorized request' });
  }

  try {
    const user = await AuthService.findByUsername(req.app.get('db'), user_name);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized request' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Unauthorized request' });
    }

    req.user = user;
    next();
  } catch(err) {
    next(err);
  }
};

module.exports = {
  requireAuth
};