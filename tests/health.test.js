'use strict';

const request = require('supertest');
const { app } = require('../server');

describe('Health and status endpoints', () => {
  test('GET /api/health returns JSON health response', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.service).toBe('arabian-eagle-aec-gateway');
    expect(response.body.status).toBe('ONLINE');
    expect(response.body.pi.status).toBe('NOT_IMPLEMENTED');
  });

  test('GET /api/apps returns applications', async () => {
    const response = await request(app)
      .get('/api/apps')
      .expect(200);

    expect(Array.isArray(response.body.apps)).toBe(true);
    expect(response.body.apps.some((item) => item.id === 'bigish')).toBe(true);
  });

  test('GET /api/apps/:id returns NOT_DEPLOYED for unconfigured app', async () => {
    const response = await request(app)
      .get('/api/apps/gav')
      .expect(200);

    expect(response.body.status).toBe('NOT_DEPLOYED');
  });

  test('GET /api/status does not use fake ONLINE fallback', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect(200);

    const gav = response.body.apps.find((item) => item.id === 'gav');
    expect(gav.status).toBe('NOT_DEPLOYED');
  });
});
