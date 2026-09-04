/**
 * server.js - Arabian Eagle AEC Gateway
 * نسخة مبسطة ومتوافقة مع Vercel
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, param, validationResult } = require('express-validator');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 1. دالة لتوليد معرف فريد (بدون crypto.randomUUID) =====
function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ===== 2. رؤوس الأمان (Helmet) =====
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://sdk.minepi.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.minepi.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ===== 3. الضغط =====
app.use(compression());

// ===== 4. تسجيل الطلبات (مبسط) =====
app.use(morgan('dev'));

// ===== 5. تحديد المعدل (Rate Limiting) =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api/', limiter);

// ===== 6. تحديد معدل أكثر صرامة للمصادقة =====
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
});
app.use('/api/auth/', authLimiter);

// ===== 7. CORS =====
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86400,
};
app.use(cors(corsOptions));

// ===== 8. معالجة JSON =====
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ===== 9. رؤوس إضافية =====
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || generateRequestId());
  next();
});

// ===== 10. دوال التحقق =====
const validateAppId = [
  param('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('App ID is required')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('App ID must contain only lowercase letters, numbers, and hyphens'),
];

const validatePiAuth = [
  body('accessToken')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Access token is required')
    .isLength({ min: 10 })
    .withMessage('Access token must be at least 10 characters'),
  body('user')
    .isObject()
    .withMessage('User data must be an object'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => err.msg),
    });
  }
  next();
};

// ===== 11. App Registry =====
const APPS_REGISTRY = [
  { id: 'bigish-yer', name: 'BIGISH-YER', description: 'طبقة التسوية المالية الأساسية', category: 'financial', envKey: 'BIGISH_YER_API', icon: '💰' },
  { id: 'aec-fund', name: 'A.E.C Sovereign Fund', description: 'صندوق النسر العربي السيادي', category: 'financial', envKey: 'AEC_FUND_API', icon: '🏦' },
  { id: 'be-well', name: 'Be-well', description: 'منصة التأمين الصحي والرعاية', category: 'health', envKey: 'BE_WELL_API', icon: '🏥' },
  { id: 'ajyal', name: 'AJYAL', description: 'بروتوكول التعليم والإغاثة والرواتب', category: 'social', envKey: 'AJYAL_API', icon: '📚' },
  { id: 'gav', name: 'GAV', description: 'طريق البخور – التجارة والخدمات اللوجستية', category: 'commerce', envKey: 'GAV_POS_API', icon: '🛍️' },
  { id: 'suppliers-auction', name: 'Suppliers Auction', description: 'مزاد الموردين والمشتريات الحكومية', category: 'government', envKey: 'AUCTION_API', icon: '🔨' },
  { id: 'cobra', name: 'COBRA', description: 'اتصالات الطوارئ والشبكات المرنة', category: 'communications', envKey: 'COBRA_API', icon: '📡' },
  { id: 'aman', name: 'AMAN', description: 'بروتوكول التأمين اللامركزي الذكي', category: 'insurance', envKey: 'AMAN_API', icon: '🛡️' },
  { id: 'telcom-mobile-protocol', name: 'Telcom Protocol', description: 'بروتوكول الاتصالات الرقمية والخدمات الخلوية', category: 'communications', envKey: 'TELCOM_API', icon: '📱' },
];

// ===== 12. دوال الفحص الصحي =====
async function fetchAppHealth(appConfig) {
  const baseUrl = process.env[appConfig.envKey];
  if (!baseUrl) return { status: 'NOT_DEPLOYED', url: null };

  // التحقق من صحة الرابط
  try {
    const url = new URL(baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return { status: 'UNKNOWN', url: baseUrl };
  }

  const healthUrl = `${baseUrl}/api/health`;
  const timeout = 5000;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(healthUrl, { 
      signal: controller.signal,
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'AEC-Gateway/1.0',
      }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return { status: 'ONLINE', url: baseUrl };
    } else {
      return { status: 'DEGRADED', url: baseUrl };
    }
  } catch (error) {
    return { status: 'OFFLINE', url: baseUrl };
  }
}

async function getAllAppsStatus() {
  const statusPromises = APPS_REGISTRY.map(async (app) => {
    const healthResult = await fetchAppHealth(app);
    return {
      id: app.id,
      name: app.name,
      description: app.description,
      category: app.category,
      icon: app.icon || '📦',
      url: healthResult.url,
      status: healthResult.status,
      version: '1.0.0',
    };
  });
  return await Promise.all(statusPromises);
}

// ===== 13. نقاط النهاية API =====

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.get('/api/apps', async (req, res) => {
  try {
    const appsStatus = await getAllAppsStatus();
    res.status(200).json(appsStatus);
  } catch (error) {
    console.error('Error fetching apps:', error);
    res.status(500).json({ error: 'Failed to fetch apps status' });
  }
});

app.get('/api/apps/:id', validateAppId, handleValidationErrors, async (req, res) => {
  const { id } = req.params;
  const appConfig = APPS_REGISTRY.find((app) => app.id === id);

  if (!appConfig) {
    return res.status(404).json({ error: 'App not found' });
  }

  try {
    const healthResult = await fetchAppHealth(appConfig);
    res.status(200).json({
      id: appConfig.id,
      name: appConfig.name,
      description: appConfig.description,
      category: appConfig.category,
      icon: appConfig.icon || '📦',
      url: healthResult.url,
      status: healthResult.status,
      version: '1.0.0',
    });
  } catch (error) {
    console.error(`Error fetching app ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch app status' });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    const appsStatus = await getAllAppsStatus();
    const onlineCount = appsStatus.filter((app) => app.status === 'ONLINE').length;
    const degradedCount = appsStatus.filter((app) => app.status === 'DEGRADED').length;
    const offlineCount = appsStatus.filter((app) => app.status === 'OFFLINE').length;
    const notDeployedCount = appsStatus.filter((app) => app.status === 'NOT_DEPLOYED').length;

    let overallStatus = 'HEALTHY';
    if (offlineCount > 0 || degradedCount > 0) overallStatus = 'DEGRADED';
    if (offlineCount === appsStatus.length) overallStatus = 'OFFLINE';

    res.status(200).json({
      overallStatus,
      summary: {
        total: appsStatus.length,
        online: onlineCount,
        degraded: degradedCount,
        offline: offlineCount,
        notDeployed: notDeployedCount,
      },
      apps: appsStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch overall status' });
  }
});

app.post('/api/auth/pi', validatePiAuth, handleValidationErrors, async (req, res) => {
  try {
    const { accessToken, user } = req.body;
    
    // تسجيل محاولة المصادقة (بدون كتابة ملفات)
    console.log(`[AUTH] IP: ${req.ip} - User: ${user.username || 'Unknown'}`);
    
    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        walletAddress: user.walletAddress,
      },
      message: 'Authentication successful',
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ===== 14. الصفحات الثابتة =====
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/support', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'support.html'));
});

app.get('/knowledge-base', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'knowledge-base.html'));
});

app.get('/pi-auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pi-auth.html'));
});

// ===== 15. معالجة الأخطاء =====
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ===== 16. تصدير لـ Vercel =====
module.exports = app;

// ===== 17. تشغيل محلي =====
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Gateway running on port ${PORT}`);
    console.log(`📋 ${APPS_REGISTRY.length} applications registered`);
    console.log(`🔒 Security features enabled`);
  });
}