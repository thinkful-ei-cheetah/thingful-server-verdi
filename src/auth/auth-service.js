'use strict';

const AuthService = {
  parseBasicToken(token){
    return Buffer.from(token, 'base64').toString().split(':');
  },

  findByUsername(knex, user_name){
    return knex('thingful_users').where({user_name}).first('*');
  }
};

module.exports = AuthService;