const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3314;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================
// متغيرات البيئة — موحدة
// ============================================
const BIGISH_YER_URL = process.env.BIGISH_YER_URL || '';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const HEALTH_TIMEOUT = parseInt(process.env.HEALTH_TIMEOUT) || 3000;

// ============================================
// Middleware
// ============================================
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ============================================
// تسجيل الخدمات — الحالة تعتمد فقط على Health Check الفعلي
// ============================================
const serviceRegistry = [
  {
    id: 'bigish',
    name: 'BIGISH-YER',
    url: BIGISH_YER_URL || null,
    implemented: true
  },
  {
    id: 'gav',
    name: 'GAV The Incense Route',
    url: null,
    implemented: false
  },
  {
    id: 'ajyal',
    name: 'AJYAL',
    url: null,
    implemented: false
  },
  {
    id: 'auction',
    name: 'Suppliers Auction',
    url: null,
    implemented: false
  },
  {
    id: 'cobra',
    name: 'COBRA Protocol',
    url: null,
    implemented: false
  },
  {
    id: 'aman',
    name: 'AMAN Protocol',
    url: null,
    implemented: false
  },
  {
    id: 'bewell',
    name: 'Be Well',
    url: null,
    implemented: false
  },
  {
    id: 'telcom',
    name: 'Telcom Mobile Protocol',
    url: null,
    implemented: false
  },
  {
    id: 'aecfund',
    name: 'Arab Eagle Sovereign Fund',
    url: null,
    implemented: false
  }
];

// ============================================
// دالة فحص صحة الخدمة الفعلية
// ============================================
const fetch = require('node-fetch');

async function checkServiceHealth(service) {
  // إذا لم يكن هناك URL → NOT_DEPLOYED
  if (!service.url || service.url === '') {
    return 'NOT_DEPLOYED';
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

    const response = await fetch(`${service.url}/api/health`, {
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return 'DEGRADED';
    }

    const data = await response.json();
    if (data.status === 'ONLINE') {
      return 'ONLINE';
    } else {
      return 'DEGRADED';
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return 'DEGRADED';
    }
    return 'OFFLINE';
  }
}

// ============================================
// نقاط النهاية (Endpoints)
// ============================================

// GET /api/health — صحة البوابة نفسها
app.get('/api/health', (req, res) => {
  res.json({
    service: 'arabian-eagle-aec-gateway',
    status: 'ONLINE',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    pi: {
      status: 'NOT_IMPLEMENTED'
    }
  });
});

// GET /api/apps — قائمة جميع الخدمات مع حالتها الفعلية
app.get('/api/apps', async (req, res) => {
  const results = [];
  for (const service of serviceRegistry) {
    const status = await checkServiceHealth(service);
    results.push({
      id: service.id,
      name: service.name,
      status: status,
      implemented: service.implemented
    });
  }
  res.json({ services: results });
});

// GET /api/apps/:id — حالة خدمة محددة
app.get('/api/apps/:id', async (req, res) => {
  const { id } = req.params;
  const service = serviceRegistry.find(s => s.id === id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }
  const status = await checkServiceHealth(service);
  res.json({
    id: service.id,
    name: service.name,
    status: status,
    implemented: service.implemented
  });
});

// GET /api/status — اختصار للحالة الكلية
app.get('/api/status', async (req, res) => {
  const services = [];
  for (const service of serviceRegistry) {
    const status = await checkServiceHealth(service);
    services.push({
      key: service.id,
      status: status
    });
  }
  res.json({ services });
});

// ============================================
// 404 Handling
// ============================================
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ============================================
// تشغيل الخادم
// ============================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ AEC Gateway running on port ${PORT} (${NODE_ENV})`);
  });
}

module.exports = app;