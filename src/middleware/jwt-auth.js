'use strict';
const AuthService = require('../auth/auth-service');

const requireAuth = async (req, res, next) => {
  const authToken = req.get('Authorization') || '';
  let token;

  if (!authToken.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  } 
    
  token = authToken.slice('bearer '.length, authToken.length);

  try {
    const payload = await AuthService.verifyJwt(token);
    const user = await AuthService.findByUsername(req.app.get('db'), payload.sub);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized request' });
    }

    req.user = user;
    next();
  } catch(err) {
    res.status(401).json({ error: 'Unauthorized request' });
  }
};

module.exports = {
  requireAuth
};