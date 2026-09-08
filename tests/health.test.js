const request = require('supertest');
const app = require('../server');

describe('Health Endpoints', () => {
  it('GET /api/health should return service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('service', 'arabian-eagle-aec-gateway');
    expect(res.body).toHaveProperty('status', 'ONLINE');
    expect(res.body).toHaveProperty('environment');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body.pi).toHaveProperty('status', 'NOT_IMPLEMENTED');
  });

  it('GET /api/apps should return all services', async () => {
    const res = await request(app).get('/api/apps');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('services');
    expect(Array.isArray(res.body.services)).toBe(true);
    expect(res.body.services.length).toBeGreaterThan(0);
    // التحقق من وجود BIGISH-YER
    const bigish = res.body.services.find(s => s.id === 'bigish');
    expect(bigish).toBeDefined();
    // BIGISH-YER يجب أن يكون NOT_DEPLOYED إذا لم يتم تعيين URL
    expect(bigish.status).toBeDefined();
  });

  it('GET /api/apps/bigish should return specific service status', async () => {
    const res = await request(app).get('/api/apps/bigish');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', 'bigish');
    expect(res.body).toHaveProperty('status');
  });

  it('GET /api/status should return all services status', async () => {
    const res = await request(app).get('/api/status');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('services');
    expect(Array.isArray(res.body.services)).toBe(true);
  });

  it('GET /api/apps/unknown should return 404', async () => {
    const res = await request(app).get('/api/apps/unknown');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Service not found');
  });

  it('GET /unknown should return 404', async () => {
    const res = await request(app).get('/unknown');
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Not Found');
  });
});