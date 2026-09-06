// server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// -------------------- Security Middleware --------------------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", process.env.BIGISH_YER_URL || ''],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.static('public'));

// -------------------- Service Registry --------------------
// تعريف التطبيقات المسجلة (يتم جلب عناوينها من البيئة)
const APP_REGISTRY = {
  'bigish-yer': {
    name: 'BIGISH-YER',
    description: 'YER Financial Layer - Testnet',
    url: process.env.BIGISH_YER_URL || 'NOT_CONFIGURED',
    status: 'UNKNOWN',
    version: 'UNKNOWN',
    lastChecked: null,
  },
  'gav': {
    name: 'GAV',
    description: 'Governance & Voting',
    url: process.env.GAV_URL || 'NOT_CONFIGURED',
    status: 'NOT_DEPLOYED',
  },
  'ajyal': {
    name: 'AJYAL',
    description: 'Education & Youth',
    url: process.env.AJYAL_URL || 'NOT_CONFIGURED',
    status: 'NOT_DEPLOYED',
  },
  'auction': {
    name: 'Suppliers Auction',
    description: 'Procurement & Auction',
    url: process.env.AUCTION_URL || 'NOT_CONFIGURED',
    status: 'NOT_DEPLOYED',
  },
  'cobra': {
    name: 'COBRA',
    description: 'Crisis & Disaster Response',
    url: process.env.COBRA_URL || 'NOT_CONFIGURED',
    status: 'NOT_DEPLOYED',
  },
  'aman': {
    name: 'AMAN',
    description: 'Security & Safety',
    url: process.env.AMAN_URL || 'NOT_CONFIGURED',
    status: 'NOT_DEPLOYED',
  },
  'bewell': {
    name: 'Be-Well',
    description: 'Health & Wellness',
    url: process.env.BEWELL_URL || 'NOT_CONFIGURED',
    status: 'NOT_DEPLOYED',
  },
  'telcom': {
    name: 'TELCOM',
    description: 'Telecommunications',
    url: process.env.TELCOM_URL || 'NOT_CONFIGURED',
    status: 'NOT_DEPLOYED',
  },
  'aecfund': {
    name: 'AEC Fund',
    description: 'Sovereign Fund Reserve',
    url: process.env.AECFUND_URL || 'NOT_CONFIGURED',
    status: 'NOT_DEPLOYED',
  },
};

// -------------------- Health Check Function --------------------
const HEALTH_TIMEOUT = parseInt(process.env.HEALTH_TIMEOUT) || 5000;

async function checkServiceHealth(appKey) {
  const service = APP_REGISTRY[appKey];
  if (!service || service.url === 'NOT_CONFIGURED') {
    return { status: 'NOT_DEPLOYED', details: { error: 'URL not configured' } };
  }

  try {
    const response = await axios.get(`${service.url}/api/health`, {
      timeout: HEALTH_TIMEOUT,
      validateStatus: false,
    });
    if (response.status === 200 && response.data?.status === 'ok') {
      return { status: 'ONLINE', details: response.data };
    } else {
      return { status: 'DEGRADED', details: response.data || { error: 'Unexpected response' } };
    }
  } catch (error) {
    return { status: 'OFFLINE', details: { error: error.message } };
  }
}

// -------------------- API Routes --------------------
// نقطة صحة البوابة نفسها
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'gateway',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// قائمة جميع التطبيقات مع حالتها
app.get('/api/apps', async (req, res) => {
  const results = {};
  for (const [key, service] of Object.entries(APP_REGISTRY)) {
    // نتحقق فقط من BIGISH-YER (لأنه الوحيد المفعل حالياً)
    if (key === 'bigish-yer') {
      const health = await checkServiceHealth(key);
      service.status = health.status;
      service.details = health.details;
      service.lastChecked = new Date().toISOString();
    }
    // ننسخ البيانات الحالية (لا نعدل باقي الخدمات)
    results[key] = {
      name: service.name,
      description: service.description,
      status: service.status,
      version: service.version || 'UNKNOWN',
      lastChecked: service.lastChecked || null,
      details: service.details || null,
    };
  }
  res.json(results);
});

// حالة تطبيق معين
app.get('/api/apps/:id', async (req, res) => {
  const { id } = req.params;
  const service = APP_REGISTRY[id];
  if (!service) {
    return res.status(404).json({ error: 'Application not found' });
  }
  if (id === 'bigish-yer') {
    const health = await checkServiceHealth(id);
    service.status = health.status;
    service.details = health.details;
    service.lastChecked = new Date().toISOString();
  }
  res.json({
    name: service.name,
    description: service.description,
    status: service.status,
    version: service.version || 'UNKNOWN',
    lastChecked: service.lastChecked || null,
    details: service.details || null,
  });
});

// حالة موجزة (للـ Frontend)
app.get('/api/status', async (req, res) => {
  const summary = {
    gateway: 'online',
    services: {},
  };
  for (const [key, service] of Object.entries(APP_REGISTRY)) {
    if (key === 'bigish-yer') {
      const health = await checkServiceHealth(key);
      service.status = health.status;
      service.details = health.details;
      service.lastChecked = new Date().toISOString();
    }
    summary.services[key] = {
      status: service.status,
      lastChecked: service.lastChecked || null,
    };
  }
  res.json(summary);
});

// -------------------- Serve Frontend (Spa) --------------------
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------- Export for Vercel --------------------
module.exports = app;

// -------------------- Local Server --------------------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Gateway running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}