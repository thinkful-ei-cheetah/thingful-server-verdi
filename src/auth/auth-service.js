'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {JWT_SECRET, JWT_EXPIRY} = require('../config');
const GOOGLE_TOKEN_AUTH_URL = 'https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=';
const axios = require('axios');

const AuthService = {
  parseBasicToken(token){
    return Buffer.from(token, 'base64').toString().split(':');
  },

  findByUsername(knex, user_name){
    return knex('thingful_users').where({user_name}).first('*');
  },

  comparePasswords(loginPassword, savedPassword){
    return bcrypt.compare(loginPassword, savedPassword);
  },

  createJwt(subject, payload) {
    return jwt.sign(payload, JWT_SECRET, {
      subject,
      expiresIn: JWT_EXPIRY,
      algorithm: 'HS256',
    });
  },

  verifyJwt(token) {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
  },

  async verifyGoogleToken(id_token) {
    const res = await axios(GOOGLE_TOKEN_AUTH_URL + id_token);
    if (res.status !== 200) {
      throw new Error('unable to connect to google servers');
    }
    return res.data;
  }
};

module.exports = AuthService;