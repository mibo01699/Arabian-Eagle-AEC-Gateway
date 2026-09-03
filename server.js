// ============================================================
// الملف: server.js - البوابة السيادية الموحدة AEC Gateway
// الإصدار: متوافق مع Vercel Serverless
// ============================================================

const express = require('express');
const cors = require('cors');
const app = express();

// ============================================================
// التفعيلات الأساسية
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// نقاط النهاية الأساسية (APIs)
// ============================================================

// نقطة الصحة (Health Check)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'AEC-Gateway',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// قائمة التطبيقات (مع بياناتها)
const APPS = [
    {
        id: 'bigish-yer',
        name: 'BIGISH-YER',
        description: 'طبقة التسوية المالية الأساسية',
        url: process.env.BIGISH_YER_API || 'https://bigish-yer.vercel.app',
        status: 'ONLINE',
        version: '1.0.0',
        healthEndpoint: '/api/health',
        category: 'financial'
    },
    // يمكن إضافة باقي التطبيقات هنا...
];

app.get('/api/apps', (req, res) => {
    res.json(APPS);
});

// الحصول على تطبيق محدد
app.get('/api/apps/:id', (req, res) => {
    const app = APPS.find(a => a.id === req.params.id);
    if (!app) {
        return res.status(404).json({ error: 'Application not found' });
    }
    res.json(app);
});

// الحالة العامة للمنظومة
app.get('/api/status', (req, res) => {
    res.json({
        status: 'operational',
        services: APPS.map(a => ({ id: a.id, status: a.status })),
        timestamp: new Date().toISOString()
    });
});

// المسار الرئيسي (للتحقق)
app.get('/', (req, res) => {
    res.json({
        message: '🦅 AEC Gateway API is running',
        version: '1.0.0',
        endpoints: ['/api/health', '/api/apps', '/api/apps/:id', '/api/status']
    });
});

// ============================================================
// ✅ نقطة الدخول لـ Vercel (تصدير التطبيق مباشرة)
// ============================================================
module.exports = app;