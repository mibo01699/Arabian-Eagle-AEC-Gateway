// ===== اختبار تدفق Pi =====
describe('Pi Authentication Flow', () => {
  test('should load Pi auth page', async () => {
    const response = await request(app)
      .get('/pi-auth')
      .expect(200);
    expect(response.text).toContain('مصادقة Pi');
  });

  test('should authenticate with valid Pi token', async () => {
    // هذا الاختبار يتطلب محاكاة (mock) لدالة fetch في الخادم
    const response = await request(app)
      .post('/api/auth/pi')
      .send({
        accessToken: 'valid_token_1234567890',
      })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.user).toHaveProperty('username');
    expect(response.body.user).toHaveProperty('walletAddress');
  });

  test('should reject authentication with invalid Pi token', async () => {
    const response = await request(app)
      .post('/api/auth/pi')
      .send({
        accessToken: 'invalid_token',
      })
      .expect(401);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', 'Invalid or expired token');
  });
});