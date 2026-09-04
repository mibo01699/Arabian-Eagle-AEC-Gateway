const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// تمكين CORS و JSON middleware
app.use(cors());
app.use(express.json());

// ----- 1. App Registry المركزي (ثابت وقابل للتوسع) -----
const APPS_REGISTRY = [
  {
    id: 'bigish-yer',
    name: 'BIGISH-YER',
    description: 'طبقة التسوية المالية الأساسية',
    category: 'financial',
    envKey: 'BIGISH_YER_API', // مفتاح متغير البيئة
    healthEndpoint: '/api/health', // نقطة نهاية الصحة الافتراضية
  },
  {
    id: 'aec-fund',
    name: 'A.E.C Sovereign Fund',
    description: 'صندوق النسر العربي السيادي (الاحتياطي والقروض)',
    category: 'financial',
    envKey: 'AEC_FUND_API',
    healthEndpoint: '/api/health',
  },
  {
    id: 'be-well',
    name: 'Be-well',
    description: 'منصة التأمين الصحي والرعاية',
    category: 'health',
    envKey: 'BE_WELL_API',
    healthEndpoint: '/api/health',
  },
  {
    id: 'ajyal',
    name: 'AJYAL',
    description: 'بروتوكول التعليم والإغاثة والرواتب',
    category: 'social',
    envKey: 'AJYAL_API',
    healthEndpoint: '/api/health',
  },
  {
    id: 'gav',
    name: 'GAV',
    description: 'طريق البخور – التجارة والخدمات اللوجستية ونقاط البيع',
    category: 'commerce',
    envKey: 'GAV_POS_API',
    healthEndpoint: '/api/health',
  },
  {
    id: 'suppliers-auction',
    name: 'suppliers-auction',
    description: 'مزاد الموردين والمشتريات الحكومية',
    category: 'government',
    envKey: 'AUCTION_API',
    healthEndpoint: '/api/health',
  },
  {
    id: 'cobra',
    name: 'COBRA',
    description: 'اتصالات الطوارئ والشبكات المرنة (eSIM، Mesh، Satellite)',
    category: 'communications',
    envKey: 'COBRA_API',
    healthEndpoint: '/api/health',
  },
  {
    id: 'aman',
    name: 'AMAN',
    description: 'بروتوكول التأمين اللامركزي الذكي (DeFi/DeIn)',
    category: 'insurance',
    envKey: 'AMAN_API',
    healthEndpoint: '/api/health',
  },
  {
    id: 'telcom-mobile-protocol',
    name: 'Telcom-Mobile-Protocol',
    description: 'بروتوكول الاتصالات الرقمية والخدمات الخلوية',
    category: 'communications',
    envKey: 'TELCOM_API',
    healthEndpoint: '/api/health',
  },
];

// ----- 2. دالة لجلب الحالة الصحية الفعلية لتطبيق واحد -----
async function fetchAppHealth(appConfig) {
  const baseUrl = process.env[appConfig.envKey];
  // إذا لم يكن الرابط موجودًا، نعتبر التطبيق غير منشور
  if (!baseUrl) {
    return { status: 'NOT_DEPLOYED', url: null };
  }

  const healthUrl = `${baseUrl}${appConfig.healthEndpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // مهلة 5 ثوانٍ

  try {
    const response = await fetch(healthUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      return { status: 'ONLINE', url: baseUrl };
    } else {
      // إذا كانت الاستجابة غير ناجحة (مثل 500)
      return { status: 'DEGRADED', url: baseUrl };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    // خطأ في الاتصال أو المهلة
    return { status: 'OFFLINE', url: baseUrl };
  }
}

// ----- 3. دالة لجلب الحالة لجميع التطبيقات (مع توازي الطلبات) -----
async function getAllAppsStatus() {
  // نبدأ بجلب الحالة لكل تطبيق على حدة بشكل متوازي (Promise.all)
  const statusPromises = APPS_REGISTRY.map(async (app) => {
    const healthResult = await fetchAppHealth(app);
    return {
      id: app.id,
      name: app.name,
      description: app.description,
      category: app.category,
      url: healthResult.url,
      status: healthResult.status,
      version: '1.0.0', // يمكن جلبها من نقطة نهاية الصحة لاحقًا
    };
  });

  return await Promise.all(statusPromises);
}

// ----- 4. نقاط النهاية (Endpoints) -----

// نقطة نهاية الصحة للبوابة نفسها
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// جلب جميع التطبيقات مع حالتها
app.get('/api/apps', async (req, res) => {
  try {
    const appsStatus = await getAllAppsStatus();
    res.status(200).json(appsStatus);
  } catch (error) {
    console.error('Error fetching apps status:', error);
    res.status(500).json({ error: 'Failed to fetch apps status' });
  }
});

// جلب تطبيق محدد بواسطة المعرف (id)
app.get('/api/apps/:id', async (req, res) => {
  const { id } = req.params;
  const appConfig = APPS_REGISTRY.find((app) => app.id === id);

  if (!appConfig) {
    return res.status(404).json({ error: 'App not found' });
  }

  try {
    const healthResult = await fetchAppHealth(appConfig);
    const appDetail = {
      id: appConfig.id,
      name: appConfig.name,
      description: appConfig.description,
      category: appConfig.category,
      url: healthResult.url,
      status: healthResult.status,
      version: '1.0.0',
    };
    res.status(200).json(appDetail);
  } catch (error) {
    console.error(`Error fetching status for app ${id}:`, error);
    res.status(500).json({ error: 'Failed to fetch app status' });
  }
});

// نقطة نهاية الحالة العامة للمنظومة
app.get('/api/status', async (req, res) => {
  try {
    const appsStatus = await getAllAppsStatus();
    const onlineCount = appsStatus.filter((app) => app.status === 'ONLINE').length;
    const totalCount = appsStatus.length;

    res.status(200).json({
      overallStatus: onlineCount === totalCount ? 'HEALTHY' : 'DEGRADED',
      online: onlineCount,
      total: totalCount,
      apps: appsStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching overall status:', error);
    res.status(500).json({ error: 'Failed to fetch overall status' });
  }
});

// ----- 5. تشغيل الخادم -----
app.listen(PORT, () => {
  console.log(`🚀 Arabian Eagle AEC Gateway running on port ${PORT}`);
  console.log(`📋 App Registry loaded with ${APPS_REGISTRY.length} applications.`);
  console.log('⚡ Set environment variables (e.g., BIGISH_YER_API) to enable health checks.');
});

// تصدير التطبيق لـ Vercel (للاستخدام في بيئة Serverless)
module.exports = app;