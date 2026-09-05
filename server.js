// ===== قائمة التطبيقات الجاهزة (تعمل حالياً) =====
const READY_APPS = ['bigish-yer', 'ajyal', 'gav', 'suppliers-auction'];

// ===== دالة الفحص الصحي المعدلة =====
async function fetchAppHealth(appConfig) {
  // إذا كان التطبيق غير جاهز، نعيد NOT_DEPLOYED فوراً
  if (!READY_APPS.includes(appConfig.id)) {
    return {
      status: 'NOT_DEPLOYED',
      url: null,
      message: 'هذا التطبيق قيد التطوير وسيتوفر قريباً'
    };
  }

  const baseUrl = process.env[appConfig.envKey];
  if (!baseUrl) {
    return {
      status: 'NOT_DEPLOYED',
      url: null,
      message: 'لم يتم تكوين رابط لهذا التطبيق بعد'
    };
  }

  try {
    const url = new URL(baseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
  } catch {
    return {
      status: 'UNKNOWN',
      url: baseUrl,
      message: 'رابط التطبيق غير صالح'
    };
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
      return {
        status: 'ONLINE',
        url: baseUrl,
        message: 'التطبيق يعمل بشكل طبيعي'
      };
    } else {
      return {
        status: 'DEGRADED',
        url: baseUrl,
        message: 'التطبيق يعمل ولكن مع وجود مشاكل'
      };
    }
  } catch (error) {
    return {
      status: 'OFFLINE',
      url: baseUrl,
      message: 'التطبيق غير متصل حالياً'
    };
  }
}

// ===== تحديث دالة getAllAppsStatus =====
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
      message: healthResult.message || '',
      version: '1.0.0',
    };
  });
  return await Promise.all(statusPromises);
}