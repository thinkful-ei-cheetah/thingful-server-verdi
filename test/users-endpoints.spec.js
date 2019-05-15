'use strict';
/* globals supertest */
const app = require('../src/app');
const knex = require('knex');
const helpers = require('./test-helpers');
const bcrypt = require('bcryptjs');
require('./setup');

describe('User Endpoints', () => {
  let db;
  before('connect db', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });

    app.set('db', db);
  });

  before('clear table data', () => helpers.cleanTables(db));
  afterEach('clear table data', () => helpers.cleanTables(db));
  after('close db connection', () => db.destroy());

  describe('POST /api/users', () => {
    const requiredFields = ['user_name', 'full_name', 'password'];
    requiredFields.forEach(field => {
      it(`returns 400 and 'Missing ${field}' in request body`, () => {
        const requestBody = {user_name: 'foo', password: 'Afake08!', full_name: 'something', nickname: 'something-else'};

        delete requestBody[field];

        return supertest(app)
          .post('/api/users')
          .set('Content-Type', 'application/json')
          .send(requestBody)
          .expect(400, {error: `Missing ${field} in request body`});
      });
    });

    const testFields = ['user_name', 'full_name', 'password', 'nickname'];
    testFields.forEach(field => {
      it(`returns 400 when ${field} starts or ends with spaces`, () => {
        const requestBody = {user_name: 'foo', password: 'Afake08!', full_name: 'something', nickname: 'something-else'};
        requestBody[field] = ' ' + requestBody[field] + ' ';
  
        return supertest(app)
          .post('/api/users')
          .set('Content-Type', 'application/json')
          .send(requestBody)
          .expect(400, {error: `${field} cannot start or end with spaces`});
      });
    });

    context('when user_name already exists', () => {
      const testUsers = helpers.makeUsersArray();
      beforeEach('seed users', () => helpers.seedUsers(db, testUsers));

      it('returns 400 and error message', () => {
        const requestBody = {user_name: 'foo', password: 'Afake08!', full_name: 'something', nickname: 'something-else'};
        requestBody.user_name = testUsers[0].user_name;

        return supertest(app)
          .post('/api/users')
          .set('Content-Type', 'application/json')
          .send(requestBody)
          .expect(400, {error: 'user_name already exists'});
      });
    });

    it('returns 400 when password is less than 8 characters', () => {
      const requestBody = {user_name: 'foo', password: 'Afake!7', full_name: 'something', nickname: 'something-else'};
      return supertest(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send(requestBody)
        .expect(400, {error: 'password must be between 8 and 72 characters'});
    });

    it('returns 400 when password is over 72 characters', () => {
      const requestBody = {user_name: 'foo', password: 'Af1!'.repeat(20), full_name: 'something', nickname: 'something-else'};
      return supertest(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send(requestBody)
        .expect(400, {error: 'password must be between 8 and 72 characters'});
    });

    const passwordRules = {
      'upper case': 'aaaa567!',
      'lower case': 'AAAAA567!',
      'special': 'Abbbb567',
      'number': 'Abbbbb!!!'
    };
    
    for (const [key, value] of Object.entries(passwordRules)) {
      it(`returns 400 when password is missing at least one ${key} character`, () => {
        const requestBody = {user_name: 'foo', password: '', full_name: 'something', nickname: 'something-else'};
        requestBody.password = value;
        return supertest(app)
          .post('/api/users')
          .set('Content-Type', 'application/json')
          .send(requestBody)
          .expect(400, {error: 'password must contain at least one of each: upper case, lower case, number and special character'});
      });
    }

    it('saves the user', () => {
      const requestBody = {user_name: 'foo', password: 'Afake08!', full_name: 'something'};
      return supertest(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send(requestBody)
        .expect(201)
        .then(async (res) => {
          const savedUser = await db('thingful_users')
            .where({user_name: requestBody.user_name})
            .first('*');
          expect(requestBody.password).to.not.equal(savedUser.password);
          const isMatch = await bcrypt.compare(requestBody.password, savedUser.password);
          // eslint-disable-next-line no-unused-expressions
          expect(isMatch).to.be.true;
          expect(res.body.user_name).to.equal(savedUser.user_name);
          expect(res.body.full_name).to.equal(savedUser.full_name);
          // eslint-disable-next-line no-unused-expressions
          expect(savedUser.nickname).to.be.null;
          expect(res.headers.location).to.equal(`/api/users/${res.body.id}`);
          // eslint-disable-next-line no-unused-expressions
          expect(res.body.password).to.be.undefined;
        });
    });
    
    
    
  });
});