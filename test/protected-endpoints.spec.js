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

  beforeEach('insert things', () =>
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
      it('returns 401 "Missing bearer token" if no token provided', () => {
        return endpoint.method(endpoint.path)
          .expect(401, {error: 'Missing bearer token'});
      });

      it('returns 401 "Unauthorized request" when invalid JWT secret', () => {
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(testUsers[0], 'badSecret'))
          .expect(401, { error: 'Unauthorized request' });
      });

      it('returns 401 "Unauthorized request" when invalid username', () => {
        const invalidUser = { user_name: 'user-not-existy', id: 1 };
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: 'Unauthorized request' });
      });
    });
  });
});