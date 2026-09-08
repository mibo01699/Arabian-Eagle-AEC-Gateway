'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const BIGISH_URL = process.env.BIGISH_URL || '';

const allowedStatuses = new Set([
  'ONLINE',
  'DEGRADED',
  'OFFLINE',
  'NOT_DEPLOYED',
  'UNKNOWN'
]);

const apps = [
  {
    id: 'bigish',
    name: 'BIGISH',
    url: BIGISH_URL || null,
    implemented: true
  },
  {
    id: 'gav',
    name: 'GAV',
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
    id: 'suppliers-auction',
    name: 'Suppliers Auction',
    url: null,
    implemented: false
  },
  {
    id: 'cobra',
    name: 'COBRA',
    url: null,
    implemented: false
  },
  {
    id: 'aman',
    name: 'AMAN',
    url: null,
    implemented: false
  },
  {
    id: 'be-well',
    name: 'Be-Well',
    url: null,
    implemented: false
  },
  {
    id: 'telcom',
    name: 'TELCOM',
    url: null,
    implemented: false
  },
  {
    id: 'aec-fund',
    name: 'AEC Fund',
    url: null,
    implemented: false
  }
];

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false
}));

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

async function checkServiceHealth(serviceUrl) {
  if (!serviceUrl || !isValidHttpUrl(serviceUrl)) {
    return {
      status: 'NOT_DEPLOYED',
      reachable: false,
      reason: 'VALID_URL_REQUIRED'
    };
  }

  const healthUrl = new URL('/api/health', serviceUrl).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        status: 'DEGRADED',
        reachable: true,
        httpStatus: response.status
      };
    }

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return {
        status: 'DEGRADED',
        reachable: true,
        reason: 'HEALTH_RESPONSE_NOT_JSON'
      };
    }

    return {
      status: 'ONLINE',
      reachable: true,
      httpStatus: response.status
    };
  } catch (error) {
    return {
      status: 'OFFLINE',
      reachable: false,
      reason: error.name === 'AbortError' ? 'TIMEOUT' : 'REQUEST_FAILED'
    };
  } finally {
    clearTimeout(timeout);
  }
}

function localHealth() {
  return {
    service: 'arabian-eagle-aec-gateway',
    status: 'ONLINE',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    pi: {
      status: 'NOT_IMPLEMENTED'
    }
  };
}

app.get('/api/health', (req, res) => {
  res.status(200).json(localHealth());
});

app.get('/api/apps', (req, res) => {
  res.status(200).json({
    apps: apps.map(({ id, name, url, implemented }) => ({
      id,
      name,
      url,
      implemented
    }))
  });
});

app.get('/api/apps/:id', async (req, res) => {
  const service = apps.find((item) => item.id === req.params.id);

  if (!service) {
    return res.status(404).json({
      error: 'APP_NOT_FOUND',
      message: 'Application was not found'
    });
  }

  const health = service.implemented
    ? await checkServiceHealth(service.url)
    : {
        status: 'NOT_DEPLOYED',
        reachable: false,
        reason: 'INTEGRATION_NOT_DEPLOYED'
      };

  return res.status(200).json({
    id: service.id,
    name: service.name,
    url: service.url,
    implemented: service.implemented,
    ...health
  });
});

app.get('/api/status', async (req, res) => {
  const results = await Promise.all(
    apps.map(async (service) => {
      const health = service.implemented
        ? await checkServiceHealth(service.url)
        : {
            status: 'NOT_DEPLOYED',
            reachable: false,
            reason: 'INTEGRATION_NOT_DEPLOYED'
          };

      return {
        id: service.id,
        name: service.name,
        url: service.url,
        ...health
      };
    })
  );

  res.status(200).json({
    gateway: localHealth(),
    apps: results,
    allowedStatuses: Array.from(allowedStatuses),
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Route was not found'
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AEC Gateway listening on port ${PORT}`);
  });
}

module.exports = {
  app,
  apps,
  checkServiceHealth,
  isValidHttpUrl
};
