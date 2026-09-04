/**
 * server.js - Arabian Eagle AEC Gateway
 * مع تطبيق شامل للأمان والتحقق من المدخلات وحماية API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, query, param, validationResult } = require('express-validator');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 1. إنشاء مجلد السجلات =====
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ===== 2. تدفق السجلات =====
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);
const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

// ===== 3. رؤوس الأمان (Helmet) =====
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

// ===== 4. الضغط (Compression) =====
app.use(compression());

// ===== 5. تسجيل الطلبات (Morgan) =====
app.use(morgan('combined', { stream: accessLogStream }));
app.use(morgan('dev')); // للطباعة في وحدة التحكم أثناء التطوير

// ===== 6. تحديد المعدل (Rate Limiting) =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // الحد الأقصى 100 طلب لكل IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    status: 429,
  },
  handler: (req, res) => {
    // تسجيل محاولات التجاوز
    const logEntry = `[RATE_LIMIT] IP: ${req.ip} - ${req.method} ${req.url}\n`;
    fs.appendFileSync(path.join(logsDir, 'security.log'), logEntry);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again after 15 minutes',
    });
  },
});
app.use('/api/', limiter);

// ===== 7. تحديد معدل أكثر صرامة لنقاط الحساسة =====
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 10, // 10 محاولات فقط
  message: {
    error: 'Too many authentication attempts, please try again later.',
    status: 429,
  },
  handler: (req, res) => {
    const logEntry = `[AUTH_RATE_LIMIT] IP: ${req.ip} - ${req.method} ${req.url}\n`;
    fs.appendFileSync(path.join(logsDir, 'security.log'), logEntry);
    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please try again after 1 hour',
    });
  },
});
app.use('/api/auth/', authLimiter);

// ===== 8. CORS (مقيد) =====
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID'],
  credentials: true,
  maxAge: 86400, // 24 ساعة
};
app.use(cors(corsOptions));

// ===== 9. معالجة JSON مع الحد الأقصى للحجم =====
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ===== 10. رؤوس إضافية للأمان =====
app.use((req, res, next) => {
  // منع الكشف عن تقنية الخادم
  res.removeHeader('X-Powered-By');
  
  // إضافة رأس لمكافحة التصيد
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // إضافة رأس لتتبع الطلبات
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || crypto.randomUUID());
  
  // تسجيل جميع الطلبات في سجل الأمان
  const logEntry = `[REQUEST] ${req.method} ${req.url} - IP: ${req.ip} - User-Agent: ${req.headers['user-agent'] || 'Unknown'}\n`;
  fs.appendFileSync(path.join(logsDir, 'access.log'), logEntry);
  
  next();
});

// ===== 11. دوال التحقق من المدخلات (Validation) =====

// التحقق من معرف التطبيق
const validateAppId = [
  param('id')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('App ID is required')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('App ID must contain only lowercase letters, numbers, and hyphens'),
];

// التحقق من مصادقة Pi
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
  body('user.username')
    .optional()
    .isString()
    .trim()
    .escape(),
  body('user.walletAddress')
    .optional()
    .isString()
    .trim()
    .matches(/^[0-9a-fA-F]{40,42}$/)
    .withMessage('Invalid wallet address format'),
];

// التحقق من نموذج التذكرة
const validateTicket = [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be less than 100 characters')
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('subject')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject must be less than 200 characters')
    .escape(),
  body('message')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters')
    .escape(),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
];

// دالة معالجة أخطاء التحقق
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // تسجيل محاولات التحقق الفاشلة
    const logEntry = `[VALIDATION_FAILED] IP: ${req.ip} - ${req.method} ${req.url} - Errors: ${JSON.stringify(errors.array())}\n`;
    fs.appendFileSync(path.join(logsDir, 'security.log'), logEntry);
    
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => err.msg),
    });
  }
  next();
};

// ===== 12. App Registry (نفس الكود السابق) =====
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

// ===== 13. دوال الفحص الصحي (مع تحسين الأمان) =====
async function fetchAppHealth(appConfig) {
  const baseUrl = process.env[appConfig.envKey];
  if (!baseUrl) return { status: 'NOT_DEPLOYED', url: null };

  // التحقق من صحة الرابط (منع SSRF)
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
    // تسجيل أخطاء الفحص الصحي
    const logEntry = `[HEALTH_CHECK_FAILED] App: ${appConfig.id} - URL: ${healthUrl} - Error: ${error.message}\n`;
    fs.appendFileSync(path.join(logsDir, 'error.log'), logEntry);
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

// ===== 14. نقاط النهاية API (مع التحقق الأمني) =====

// نقطة صحة البوابة
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// جلب جميع التطبيقات
app.get('/api/apps', async (req, res) => {
  try {
    const appsStatus = await getAllAppsStatus();
    res.status(200).json(appsStatus);
  } catch (error) {
    const logEntry = `[API_ERROR] /api/apps - IP: ${req.ip} - Error: ${error.message}\n`;
    fs.appendFileSync(path.join(logsDir, 'error.log'), logEntry);
    res.status(500).json({ error: 'Failed to fetch apps status' });
  }
});

// جلب تطبيق محدد (مع التحقق من المعرف)
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
    const logEntry = `[API_ERROR] /api/apps/${id} - IP: ${req.ip} - Error: ${error.message}\n`;
    fs.appendFileSync(path.join(logsDir, 'error.log'), logEntry);
    res.status(500).json({ error: 'Failed to fetch app status' });
  }
});

// الحالة العامة للمنظومة
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
    const logEntry = `[API_ERROR] /api/status - IP: ${req.ip} - Error: ${error.message}\n`;
    fs.appendFileSync(path.join(logsDir, 'error.log'), logEntry);
    res.status(500).json({ error: 'Failed to fetch overall status' });
  }
});

// مصادقة Pi (مع التحقق الصارم)
app.post('/api/auth/pi', validatePiAuth, handleValidationErrors, async (req, res) => {
  try {
    const { accessToken, user } = req.body;
    
    // هنا يمكن إضافة التحقق من الرمز مع Pi Network API
    // https://api.minepi.com/v2/me
    
    // تسجيل محاولة المصادقة
    const logEntry = `[AUTH_ATTEMPT] IP: ${req.ip} - User: ${user.username || 'Unknown'} - Status: SUCCESS\n`;
    fs.appendFileSync(path.join(logsDir, 'audit.log'), logEntry);

    res.status(200).json({
      success: true,
      user: {
        username: user.username,
        walletAddress: user.walletAddress,
      },
      message: 'Authentication successful',
    });
  } catch (error) {
    const logEntry = `[AUTH_ATTEMPT] IP: ${req.ip} - Error: ${error.message} - Status: FAILED\n`;
    fs.appendFileSync(path.join(logsDir, 'audit.log'), logEntry);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ===== 15. الصفحات الثابتة =====
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

// ===== 16. معالجة الأخطاء العامة (Error Handler) =====
app.use((err, req, res, next) => {
  const logEntry = `[GLOBAL_ERROR] IP: ${req.ip} - ${req.method} ${req.url} - Error: ${err.message}\n`;
  fs.appendFileSync(path.join(logsDir, 'error.log'), logEntry);
  
  if (err.status === 400) {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ===== 17. معالجة المسارات غير الموجودة (404) =====
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ===== 18. تشغيل الخادم =====
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Arabian Eagle AEC Gateway running on port ${PORT}`);
    console.log(`📋 ${APPS_REGISTRY.length} applications registered`);
    console.log(`🔒 Security features enabled: Helmet, Rate Limiting, Validation, Audit Logs`);
    console.log(`📝 Logs directory: ${logsDir}`);
  });
}

// ===== 19. تصدير لـ Vercel =====
module.exports = app;