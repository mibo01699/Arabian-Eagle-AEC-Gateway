/**
 * api.js - دوال التواصل مع Gateway API
 * مع دعم رؤوس الأمان والتعامل مع الأخطاء
 */

const API_BASE = window.location.origin;

// ===== إنشاء معرف طلب فريد =====
function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ===== دالة جلب آمنة =====
async function secureFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const requestId = generateRequestId();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'Accept': 'application/json',
    },
    credentials: 'include',
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);
    
    // التحقق من رأس X-Request-ID في الاستجابة
    const responseRequestId = response.headers.get('X-Request-ID');
    if (responseRequestId && responseRequestId !== requestId) {
      console.warn('Request ID mismatch detected');
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.message) errorMessage = errorData.message;
        if (errorData.error) errorMessage = errorData.error;
      } catch (e) {
        // تجاهل
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ===== دوال API =====
async function fetchSystemStatus() {
  return secureFetch('/api/status');
}

async function fetchApps() {
  return secureFetch('/api/apps');
}

async function fetchAppDetails(appId) {
  // التحقق من صحة المعرف
  if (!appId || !/^[a-z0-9-]+$/.test(appId)) {
    throw new Error('Invalid app ID format');
  }
  return secureFetch(`/api/apps/${encodeURIComponent(appId)}`);
}

async function fetchGatewayHealth() {
  return secureFetch('/api/health');
}

async function authenticateWithPi(accessToken, userData) {
  return secureFetch('/api/auth/pi', {
    method: 'POST',
    body: JSON.stringify({
      accessToken,
      user: userData,
    }),
  });
}

// ===== تصدير =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    fetchSystemStatus,
    fetchApps,
    fetchAppDetails,
    fetchGatewayHealth,
    authenticateWithPi,
  };
}