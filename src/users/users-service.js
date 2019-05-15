'use strict';

const bcrypt = require('bcryptjs');
const xss = require('xss');

const UsersService = {
  async validateFields(db, user) {
    const result = {};

    // ensure no fields start or end with spaces
    for (const [key, value] of Object.entries(user)) {
      if (value.startsWith(' ') || value.endsWith(' ')) {
        result.error = `${key} cannot start or end with spaces`;
      }
    }

    // ensure username is unique
    const foundUser = await db('thingful_users').where({user_name: user.user_name}).select('*');
    if (foundUser.length) {
      result.error = 'user_name already exists';
    }

    // ensure password is min 8 and max 72
    if (user.password.length < 8 || user.password.length > 72) {
      result.error = 'password must be between 8 and 72 characters';
    }

    // 'password must contain 1 upper case, 1 lower case, 1 special char and 1 digit'
    const regex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;
    if (!regex.test(user.password)) {
      result.error = 'password must contain at least one of each: upper case, lower case, number and special character';
    }

    return result;
  },

  hashPassword(password){
    return bcrypt.hash(password, 10);
  },

  sanitize(user){
    const filtered = {};
    for (const [key, value] of Object.entries(user)) {
      filtered[key] = xss(value);
    }
    return filtered;
  },

  insert(db, user) {
    return db('thingful_users')
      .insert(user)
      .returning('*')
      .then(rows => rows[0]);
  },

};

module.exports = UsersService;