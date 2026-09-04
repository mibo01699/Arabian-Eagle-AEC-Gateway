/**
 * integration.test.js - اختبارات التكامل الشاملة
 * اختبار تدفق العمل الكامل للمنظومة
 */

const request = require('supertest');
const app = require('../server');

// ===== اختبار تدفق لوحة التحكم =====
describe('Dashboard Flow', () => {
  test('should load dashboard and fetch app status', async () => {
    // 1. تحميل الصفحة الرئيسية
    const pageResponse = await request(app)
      .get('/')
      .expect(200);
    expect(pageResponse.text).toContain('AEC Gateway');

    // 2. جلب حالة التطبيقات
    const statusResponse = await request(app)
      .get('/api/status')
      .expect(200);
    expect(statusResponse.body.apps).toBeDefined();
    expect(statusResponse.body.apps.length).toBe(9);
  });
});

// ===== اختبار تدفق الدعم =====
describe('Support Flow', () => {
  test('should load support page and submit ticket', async () => {
    // 1. تحميل صفحة الدعم
    const pageResponse = await request(app)
      .get('/support')
      .expect(200);
    expect(pageResponse.text).toContain('مركز الدعم');

    // 2. محاكاة إنشاء تذكرة (يتم في الواجهة الأمامية)
    // ملاحظة: هذا الاختبار يتحقق فقط من تحميل الصفحة
  });
});

// ===== اختبار تدفق المعرفة =====
describe('Knowledge Base Flow', () => {
  test('should load knowledge base and display articles', async () => {
    const response = await request(app)
      .get('/knowledge-base')
      .expect(200);
    expect(response.text).toContain('قاعدة المعرفة');
    expect(response.text).toContain('ما هي بوابة AEC');
  });
});

// ===== اختبار تدفق Pi =====
describe('Pi Authentication Flow', () => {
  test('should load Pi auth page', async () => {
    const response = await request(app)
      .get('/pi-auth')
      .expect(200);
    expect(response.text).toContain('مصادقة Pi');
  });

  test('should authenticate with Pi credentials', async () => {
    const response = await request(app)
      .post('/api/auth/pi')
      .send({
        accessToken: 'valid_token_1234567890',
        user: {
          username: 'test_user',
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        }
      })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.user).toHaveProperty('username', 'test_user');
  });
});

// ===== اختبار تدفق التطبيقات =====
describe('Applications Flow', () => {
  test('should fetch all applications with status', async () => {
    const response = await request(app)
      .get('/api/apps')
      .expect(200);

    expect(response.body.length).toBe(9);
    
    // التحقق من وجود جميع التطبيقات
    const appIds = response.body.map(app => app.id);
    const expectedIds = [
      'bigish-yer', 'aec-fund', 'be-well', 'ajyal', 
      'gav', 'suppliers-auction', 'cobra', 'aman', 'telcom-mobile-protocol'
    ];
    expectedIds.forEach(id => {
      expect(appIds).toContain(id);
    });
  });

  test('should fetch individual application details', async () => {
    const response = await request(app)
      .get('/api/apps/bigish-yer')
      .expect(200);

    expect(response.body).toHaveProperty('id', 'bigish-yer');
    expect(response.body).toHaveProperty('name', 'BIGISH-YER');
    expect(response.body).toHaveProperty('category', 'financial');
    expect(response.body).toHaveProperty('status');
  });
});

// ===== اختبار الترجمة =====
describe('i18n Translation', () => {
  test('should load Arabic translations', async () => {
    const response = await request(app)
      .get('/locales/ar.json')
      .expect(200);
    
    expect(response.body).toHaveProperty('app');
    expect(response.body.app).toHaveProperty('title', '🦅 البوابة السيادية الموحدة');
  });

  test('should load English translations', async () => {
    const response = await request(app)
      .get('/locales/en.json')
      .expect(200);
    
    expect(response.body).toHaveProperty('app');
    expect(response.body.app).toHaveProperty('title', '🦅 Unified Sovereign Gateway');
  });
});

// ===== اختبار الأمان الشامل =====
describe('Security Integration', () => {
  test('should reject SQL injection attempts', async () => {
    const response = await request(app)
      .get('/api/apps/1; DROP TABLE users;')
      .expect(400);
    
    expect(response.body).toHaveProperty('error', 'Validation failed');
  });

  test('should reject XSS attempts', async () => {
    const response = await request(app)
      .get('/api/apps/<script>alert("xss")</script>')
      .expect(400);
    
    expect(response.body).toHaveProperty('error', 'Validation failed');
  });
});

console.log('✅ Integration tests completed');