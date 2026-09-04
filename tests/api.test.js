/**
 * api.test.js - اختبارات نقاط النهاية API
 * يستخدم supertest لمحاكاة طلبات HTTP
 */

const request = require('supertest');
const app = require('../server');

// ===== اختبارات مسار الصحة =====
describe('GET /api/health', () => {
  test('should return status UP', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version', '1.0.0');
  });
});

// ===== اختبارات جلب جميع التطبيقات =====
describe('GET /api/apps', () => {
  test('should return array of 9 applications', async () => {
    const response = await request(app)
      .get('/api/apps')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(9);
    
    // التحقق من وجود الحقول الأساسية
    response.body.forEach(app => {
      expect(app).toHaveProperty('id');
      expect(app).toHaveProperty('name');
      expect(app).toHaveProperty('description');
      expect(app).toHaveProperty('category');
      expect(app).toHaveProperty('status');
      expect(['ONLINE', 'OFFLINE', 'DEGRADED', 'NOT_DEPLOYED', 'UNKNOWN']).toContain(app.status);
    });
  });
});

// ===== اختبارات جلب تطبيق محدد =====
describe('GET /api/apps/:id', () => {
  test('should return valid application details', async () => {
    const response = await request(app)
      .get('/api/apps/bigish-yer')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('id', 'bigish-yer');
    expect(response.body).toHaveProperty('name', 'BIGISH-YER');
    expect(response.body).toHaveProperty('category', 'financial');
  });

  test('should return 404 for non-existent app', async () => {
    const response = await request(app)
      .get('/api/apps/non-existent')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toHaveProperty('error', 'App not found');
  });

  test('should validate app ID format', async () => {
    const response = await request(app)
      .get('/api/apps/invalid@id')
      .expect('Content-Type', /json/)
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Validation failed');
    expect(response.body.details).toBeDefined();
  });
});

// ===== اختبارات الحالة العامة =====
describe('GET /api/status', () => {
  test('should return overall system status', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('overallStatus');
    expect(['HEALTHY', 'DEGRADED', 'OFFLINE']).toContain(response.body.overallStatus);
    expect(response.body).toHaveProperty('summary');
    expect(response.body.summary).toHaveProperty('total', 9);
    expect(response.body).toHaveProperty('apps');
    expect(Array.isArray(response.body.apps)).toBe(true);
    expect(response.body).toHaveProperty('timestamp');
  });
});

// ===== اختبارات الصفحات الثابتة =====
describe('Static pages', () => {
  test('GET / should return index.html', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.text).toContain('AEC Gateway');
  });

  test('GET /support should return support.html', async () => {
    const response = await request(app)
      .get('/support')
      .expect(200);

    expect(response.text).toContain('مركز الدعم');
  });

  test('GET /knowledge-base should return knowledge-base.html', async () => {
    const response = await request(app)
      .get('/knowledge-base')
      .expect(200);

    expect(response.text).toContain('قاعدة المعرفة');
  });

  test('GET /pi-auth should return pi-auth.html', async () => {
    const response = await request(app)
      .get('/pi-auth')
      .expect(200);

    expect(response.text).toContain('مصادقة Pi');
  });
});

// ===== اختبارات المسارات غير الموجودة =====
describe('404 handling', () => {
  test('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/unknown')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toHaveProperty('error', 'Not found');
  });
});

console.log('✅ API tests completed');
// ===== اختبارات مصادقة Pi =====
describe('POST /api/auth/pi', () => {
  test('should reject missing access token', async () => {
    const response = await request(app)
      .post('/api/auth/pi')
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Validation failed');
    expect(response.body.details).toBeDefined();
  });

  test('should reject invalid token format', async () => {
    const response = await request(app)
      .post('/api/auth/pi')
      .send({ accessToken: '123' }) // أقل من 10 أحرف
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Validation failed');
  });

  test('should handle Pi API timeout gracefully', async () => {
    // هذا الاختبار يتطلب محاكاة (mock) لدالة fetch
    // سيتم تنفيذه في بيئة اختبار معزولة
    const response = await request(app)
      .post('/api/auth/pi')
      .send({ accessToken: 'valid_token_1234567890' })
      .expect(504); // Gateway Timeout

    expect(response.body).toHaveProperty('error', 'Pi API timeout');
  });

  test('should reject invalid token from Pi API', async () => {
    // هذا الاختبار يتطلب محاكاة (mock) لدالة fetch
    const response = await request(app)
      .post('/api/auth/pi')
      .send({ accessToken: 'invalid_token' })
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Invalid or expired token');
  });

  test('should authenticate successfully with valid token', async () => {
    // هذا الاختبار يتطلب محاكاة (mock) لدالة fetch
    const response = await request(app)
      .post('/api/auth/pi')
      .send({ accessToken: 'valid_token_1234567890' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.user).toHaveProperty('username');
    expect(response.body.user).toHaveProperty('walletAddress');
  });
});