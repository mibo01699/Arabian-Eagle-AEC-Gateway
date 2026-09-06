// server.js
// Arabian Eagle AEC Gateway - Task 01: Truth & Status Alignment
// تم تعديل منطق الحالة ليعتمد على الفحص الصحي الفعلي دون أي قائمة ثابتة.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---------- تعريف التطبيقات ----------
const APP_REGISTRY = [
  {
    id: 'bigish-yer',
    name: 'BIGISH-YER',
    envKey: 'BIGISH_YER_URL',
    description: 'منصة تبادل تجاري',
  },
  {
    id: 'gav',
    name: 'GAV',
    envKey: 'GAV_URL',
    description: 'طريق البخور',
  },
  {
    id: 'ajyal',
    name: 'AJYAL',
    envKey: 'AJYAL_URL',
    description: 'إطار الأجيال',
  },
  {
    id: 'suppliers-auction',
    name: 'Suppliers-Auction',
    envKey: 'SUPPLIERS_AUCTION_URL',
    description: 'مزاد الموردين',
  },
  {
    id: 'sovereign-fund',
    name: 'A.E.C Sovereign Fund',
    envKey: 'SOVEREIGN_FUND_URL',
    description: 'الصندوق السيادي',
  },
  {
    id: 'be-well',
    name: 'Be-well',
    envKey: 'BE_WELL_URL',
    description: 'منصة الصحة',
  },
  {
    id: 'cobra',
    name: 'COBRA',
    envKey: 'COBRA_URL',
    description: 'نظام التنسيق',
  },
  {
    id: 'aman',
    name: 'AMAN',
    envKey: 'AMAN_URL',
    description: 'منصة الأمان',
  },
  {
    id: 'telcom',
    name: 'Telcom',
    envKey: 'TELCOM_URL',
    description: 'خدمات الاتصالات',
  },
];

// ---------- دالة الفحص الصحي (بدون أي تجاوز) ----------
async function fetchAppHealth(appConfig) {
  const baseUrl = process.env[appConfig.envKey];

  // 1. لا يوجد رابط -> NOT_DEPLOYED
  if (!baseUrl) {
    return { status: 'NOT_DEPLOYED', url: null };
  }

  // 2. رابط غير صالح -> UNKNOWN
  try {
    new URL(baseUrl);
  } catch {
    return { status: 'UNKNOWN', url: baseUrl };
  }

  const healthUrl = `${baseUrl}/api/health`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(healthUrl, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    // 3. استجابة HTTP ناجحة (200) ونص JSON صحيح -> ONLINE
    if (response.ok) {
      try {
        await response.json();
        return { status: 'ONLINE', url: baseUrl };
      } catch {
        // استجابة ليست JSON صحيح -> DEGRADED
        return { status: 'DEGRADED', url: baseUrl };
      }
    } else {
      // 4. استجابة HTTP غير ناجحة (404, 500, ...) -> DEGRADED
      return { status: 'DEGRADED', url: baseUrl };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    // 5. انتهاء المهلة أو فشل الشبكة -> OFFLINE
    return { status: 'OFFLINE', url: baseUrl };
  }
}

// ---------- نقطة /api/health للبوابة نفسها ----------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    message: 'AEC Gateway is running',
  });
});

// ---------- نقطة /api/apps (قائمة جميع التطبيقات مع حالتها) ----------
app.get('/api/apps', async (req, res) => {
  try {
    const results = await Promise.all(
      APP_REGISTRY.map(async (app) => {
        const health = await fetchAppHealth(app);
        return {
          id: app.id,
          name: app.name,
          description: app.description,
          status: health.status,
          url: health.url,
        };
      })
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب حالة التطبيقات' });
  }
});

// ---------- نقطة /api/apps/:id (حالة تطبيق معين) ----------
app.get('/api/apps/:id', async (req, res) => {
  const app = APP_REGISTRY.find((a) => a.id === req.params.id);
  if (!app) {
    return res.status(404).json({ error: 'تطبيق غير موجود' });
  }
  try {
    const health = await fetchAppHealth(app);
    res.json({
      id: app.id,
      name: app.name,
      description: app.description,
      status: health.status,
      url: health.url,
    });
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب الحالة' });
  }
});

// ---------- نقطة /api/status (حالة عامة مختصرة) ----------
app.get('/api/status', async (req, res) => {
  try {
    const results = await Promise.all(
      APP_REGISTRY.map(async (app) => {
        const health = await fetchAppHealth(app);
        return { id: app.id, status: health.status };
      })
    );
    const summary = {
      timestamp: new Date().toISOString(),
      apps: results,
    };
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'فشل في جلب الحالة العامة' });
  }
});

// ---------- تشغيل الخادم ----------
app.listen(port, () => {
  console.log(`AEC Gateway running on port ${port}`);
});

// تصدير app للاختبارات
module.exports = app;