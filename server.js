// server.js - نسخة متوافقة تمامًا مع Vercel Serverless
const express = require('express');
const cors = require('cors');
const app = express();

// تمكين CORS و JSON
app.use(cors());
app.use(express.json());

// ----- App Registry المركزي -----
const APPS_REGISTRY = [
  { id: 'bigish-yer', name: 'BIGISH-YER', description: 'طبقة التسوية المالية الأساسية', category: 'financial', envKey: 'BIGISH_YER_API' },
  { id: 'aec-fund', name: 'A.E.C Sovereign Fund', description: 'صندوق النسر العربي السيادي', category: 'financial', envKey: 'AEC_FUND_API' },
  { id: 'be-well', name: 'Be-well', description: 'منصة التأمين الصحي والرعاية', category: 'health', envKey: 'BE_WELL_API' },
  { id: 'ajyal', name: 'AJYAL', description: 'بروتوكول التعليم والإغاثة والرواتب', category: 'social', envKey: 'AJYAL_API' },
  { id: 'gav', name: 'GAV', description: 'طريق البخور – التجارة والخدمات اللوجستية', category: 'commerce', envKey: 'GAV_POS_API' },
  { id: 'suppliers-auction', name: 'suppliers-auction', description: 'مزاد الموردين والمشتريات الحكومية', category: 'government', envKey: 'AUCTION_API' },
  { id: 'cobra', name: 'COBRA', description: 'اتصالات الطوارئ والشبكات المرنة', category: 'communications', envKey: 'COBRA_API' },
  { id: 'aman', name: 'AMAN', description: 'بروتوكول التأمين اللامركزي الذكي', category: 'insurance', envKey: 'AMAN_API' },
  { id: 'telcom-mobile-protocol', name: 'Telcom-Mobile-Protocol', description: 'بروتوكول الاتصالات الرقمية', category: 'communications', envKey: 'TELCOM_API' },
];

// ----- دالة الفحص الصحي (متوافقة مع Node.js 18+ و Vercel) -----
async function fetchAppHealth(appConfig) {
  const baseUrl = process.env[appConfig.envKey];
  if (!baseUrl) return { status: 'NOT_DEPLOYED', url: null };

  const healthUrl = `${baseUrl}/api/health`;
  const timeout = 5000; // 5 ثوانٍ

  try {
    // استخدام fetch العالمي (Node.js 18+)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(healthUrl, { 
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
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
      url: healthResult.url,
      status: healthResult.status,
      version: '1.0.0',
    };
  });
  return await Promise.all(statusPromises);
}

// ----- نقاط النهاية -----
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.get('/api/apps', async (req, res) => {
  try {
    const appsStatus = await getAllAppsStatus();
    res.status(200).json(appsStatus);
  } catch (error) {
    console.error('Error fetching apps status:', error);
    res.status(500).json({ error: 'Failed to fetch apps status' });
  }
});

app.get('/api/apps/:id', async (req, res) => {
  const { id } = req.params;
  const appConfig = APPS_REGISTRY.find((app) => app.id === id);
  if (!appConfig) return res.status(404).json({ error: 'App not found' });

  try {
    const healthResult = await fetchAppHealth(appConfig);
    res.status(200).json({
      id: appConfig.id,
      name: appConfig.name,
      description: appConfig.description,
      category: appConfig.category,
      url: healthResult.url,
      status: healthResult.status,
      version: '1.0.0',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch app status' });
  }
});

app.get('/api/status', async (req, res) => {
  try {
    const appsStatus = await getAllAppsStatus();
    const onlineCount = appsStatus.filter((app) => app.status === 'ONLINE').length;
    res.status(200).json({
      overallStatus: onlineCount === appsStatus.length ? 'HEALTHY' : 'DEGRADED',
      online: onlineCount,
      total: appsStatus.length,
      apps: appsStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overall status' });
  }
});

// ----- تصدير لـ Vercel (يجب أن يكون بهذا الشكل) -----
module.exports = app;

// تشغيل محلي (لن يُستخدم في Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Gateway running on port ${PORT}`);
    console.log(`📋 ${APPS_REGISTRY.length} applications registered`);
  });
}