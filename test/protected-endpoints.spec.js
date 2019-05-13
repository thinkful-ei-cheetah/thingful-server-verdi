'use strict';
/* globals supertest */
const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe('Protected Endpoints', function() {
  let db;

  const {
    testUsers,
    testThings,
    testReviews,
  } = helpers.makeThingsFixtures();

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('cleanup', () => helpers.cleanTables(db));
  afterEach('cleanup', () => helpers.cleanTables(db));

  beforeEach('insert articles', () =>
    helpers.seedThingsTables(
      db,
      testUsers,
      testThings,
      testReviews,
    )
  );

  const protectedEndpoints = [
    {
      name: 'GET /api/things/:thing_id',
      path: '/api/things/1',
      method: supertest(app).get
    },
    {
      name: 'GET /api/things/:thing_id/reviews',
      path: '/api/things/1/reviews',
      method: supertest(app).get
    },
  ];

  protectedEndpoints.forEach(endpoint => {
    describe(endpoint.name, () => {
      it('returns 401 "Missing basic token" if no token provided', () => {
        return endpoint.method(endpoint.path)
          .expect(401, {error: 'Missing basic token'});
      });

      it('returns 401 "Unauthorized request" when no credentials provided', () => {
        const noCreds = {user_name: '', password: ''};
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(noCreds))
          .expect(401, { error: 'Unauthorized request' });
      });

      it('returns 401 "Unauthorized request" if invalid user', () => {
        const nonExistentUser = {user_name: 'FooBarMagic', password: 'password'};
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(nonExistentUser))
          .expect(401, { error: 'Unauthorized request' });
      });

      it('returns 401 "Unauthorized request" if invalid password', () => {
        const userWithWrongPassword = {user_name: testUsers[0].user_name, password: 'fake'};
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(userWithWrongPassword))
          .expect(401, { error: 'Unauthorized request' });
      });
    });
  });
});