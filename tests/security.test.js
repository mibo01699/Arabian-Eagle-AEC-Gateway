'use strict';

const request = require('supertest');
const { app } = require('../server');

describe('Security controls', () => {
  test('security headers are present', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBeDefined();
  });

  test('rate limit headers are present', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(
      response.headers['ratelimit-limit'] ||
      response.headers['x-ratelimit-limit']
    ).toBeDefined();
  });

  test('CORS does not allow arbitrary origins by default', async () => {
    const response = await request(app)
      .get('/api/health')
      .set('Origin', 'https://untrusted.example')
      .expect(200);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});
