/**
 * security.test.js - اختبارات الأمان
 */

const request = require('supertest');
const app = require('../server');

// ===== اختبارات رؤوس الأمان =====
describe('Security Headers', () => {
  test('should have X-Frame-Options header', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers).toHaveProperty('x-frame-options', 'DENY');
  });

  test('should have X-Content-Type-Options header', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
  });

  test('should have X-XSS-Protection header', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers).toHaveProperty('x-xss-protection', '1; mode=block');
  });

  test('should have X-Request-ID header', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers).toHaveProperty('x-request-id');
    expect(response.headers['x-request-id']).toMatch(/^req_\d+_[a-z0-9]+$/);
  });

  test('should not have X-Powered-By header', async () => {
    const response = await request(app).get('/api/health');
    expect(response.headers).not.toHaveProperty('x-powered-by');
  });
});

// ===== اختبارات Rate Limiting =====
describe('Rate Limiting', () => {
  test('should allow up to 100 requests per 15 minutes', async () => {
    // محاكاة 5 طلبات سريعة (أقل من الحد)
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(request(app).get('/api/health'));
    }
    const responses = await Promise.all(promises);
    responses.forEach(response => {
      expect(response.status).not.toBe(429);
    });
  });

  test('should return 429 when rate limit exceeded', async () => {
    // محاكاة 150 طلباً (تجاوز الحد)
    const promises = [];
    for (let i = 0; i < 150; i++) {
      promises.push(request(app).get('/api/health'));
    }
    const responses = await Promise.all(promises);
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});

// ===== اختبارات التحقق من المدخلات =====
describe('Input Validation', () => {
  test('should reject invalid app ID format', async () => {
    const response = await request(app)
      .get('/api/apps/invalid@id')
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Validation failed');
    expect(response.body.details).toBeDefined();
  });

  test('should reject missing access token in auth', async () => {
    const response = await request(app)
      .post('/api/auth/pi')
      .send({ user: { username: 'test' } })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Validation failed');
  });

  test('should reject invalid access token in auth', async () => {
    const response = await request(app)
      .post('/api/auth/pi')
      .send({ 
        accessToken: '123', // أقل من 10 أحرف
        user: { username: 'test' }
      })
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Validation failed');
  });
});

// ===== اختبارات CORS =====
describe('CORS Configuration', () => {
  test('should include CORS headers in response', async () => {
    const response = await request(app)
      .options('/api/health')
      .set('Origin', 'http://localhost:3000');

    expect(response.headers).toHaveProperty('access-control-allow-origin');
    expect(response.headers).toHaveProperty('access-control-allow-methods');
    expect(response.headers).toHaveProperty('access-control-allow-headers');
  });
});

console.log('✅ Security tests completed');