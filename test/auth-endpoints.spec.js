'use strict';
/* globals supertest */
require('./setup');
const helpers = require('./test-helpers');
const knex = require('knex');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

describe('Auth Endpoints', () => {
  let db;
  before('connect to db', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });

    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('cleanup', () => helpers.cleanTables(db));
  afterEach('cleanup', () => helpers.cleanTables(db));

  describe('POST /api/auth/login', () => {
    const testUsers = helpers.makeUsersArray();
    beforeEach('seed users', () => helpers.seedUsers(db, testUsers));

    const requiredFields = ['user_name', 'password'];
    const testUser = testUsers[0];
    
    requiredFields.forEach(field => {
      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        const data = {user_name: testUser.user_name, password: testUser.password};
        delete data[field];

        return supertest(app)
          .post('/api/auth/login')
          .send(data)
          .expect(400, {error: `Missing '${field}' in request body`});
      });
    });

    it('returns 400 and an error "Incorrect user_name or password" when invalid user', () => {
      const data = {user_name: 'fakeUserName', password: testUser.password};
      return supertest(app)
        .post('/api/auth/login')
        .send(data)
        .expect(400, {error: 'Incorrect user_name or password'});
    });

    it('returns 400 and an error "Incorrect user_name or password" when invalid password', () => {
      const data = {user_name: testUser.user_name, password: 'badPassword'};
      return supertest(app)
        .post('/api/auth/login')
        .send(data)
        .expect(400, {error: 'Incorrect user_name or password'});
    });

    it('responds 200 and JWT auth token using secret when valid credentials', () => {
      const userValidCreds = {
        user_name: testUser.user_name,
        password: testUser.password,
      };

      const expectedToken = jwt.sign(
        { user_id: testUser.id },
        process.env.JWT_SECRET,
        {
          subject: testUser.user_name,
          algorithm: 'HS256',
        }
      );
      return supertest(app)
        .post('/api/auth/login')
        .send(userValidCreds)
        .expect(200, {
          authToken: expectedToken,
        });
    });
  });
});