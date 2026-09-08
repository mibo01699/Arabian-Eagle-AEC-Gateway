// =============================================
// إضافة في أعلى الملف (مع بقية الاستيرادات)
// =============================================
const express = require('express');
const fetch = require('node-fetch');  // تأكد من تثبيته: npm install node-fetch

// =============================================
// نقطة نهاية المصادقة (ضعها بعد تعريف app)
// =============================================
app.post('/api/auth', async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'التوكن مطلوب' });
    }

    try {
        // التحقق من التوكن مع خوادم Pi
        const response = await fetch('https://api.minepi.com/v2/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return res.status(401).json({ error: 'توكن غير صالح' });
        }

        const user = await response.json();
        res.json(user);
    } catch (error) {
        console.error('❌ خطأ في التحقق من التوكن:', error);
        res.status(500).json({ error: 'خطأ في الخادم' });
    }
});

// =============================================
// نقطة نهاية حالة الخدمات (أضفها إن لم تكن موجودة)
// =============================================
app.get('/api/status', (req, res) => {
    // هنا نعيد حالة الخدمات كما هي معرفة في serviceRegistry
    // يمكنك تعديل هذا حسب هيكل الكود الحالي
    res.json({ services: [
        { key: 'bigish-yer', status: 'online' },
        { key: 'gav', status: 'offline' },
        { key: 'ajyal', status: 'offline' },
        { key: 'auction', status: 'offline' },
        { key: 'cobra', status: 'offline' },
        { key: 'aman', status: 'offline' },
        { key: 'bewell', status: 'offline' },
        { key: 'telcom', status: 'offline' },
        { key: 'aecfund', status: 'offline' }
    ]});
});