'use strict';

const request = require('supertest');
const { app } = require('../server');

describe('Local integration endpoints', () => {
  test('GET /api/status returns JSON', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.gateway.status).toBe('ONLINE');
    expect(Array.isArray(response.body.apps)).toBe(true);
  });

  test('unknown application returns 404 JSON', async () => {
    const response = await request(app)
      .get('/api/apps/does-not-exist')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.error).toBe('APP_NOT_FOUND');
  });

  test('unknown route returns 404 JSON', async () => {
    const response = await request(app)
      .get('/not-found')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body.error).toBe('NOT_FOUND');
  });
});
