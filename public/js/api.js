/**
 * api.js - دوال التواصل مع Gateway API
 */

// العنوان الأساسي (يتم تحديده تلقائيًا حسب البيئة)
const API_BASE = window.location.origin;

/**
 * جلب الحالة العامة للمنظومة
 * @returns {Promise<Object>} بيانات الحالة
 */
async function fetchSystemStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/status`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching system status:', error);
    throw error;
  }
}

/**
 * جلب قائمة التطبيقات مع حالتها
 * @returns {Promise<Array>} مصفوفة التطبيقات
 */
async function fetchApps() {
  try {
    const response = await fetch(`${API_BASE}/api/apps`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching apps:', error);
    throw error;
  }
}

/**
 * جلب تفاصيل تطبيق محدد
 * @param {string} appId - معرف التطبيق
 * @returns {Promise<Object>} تفاصيل التطبيق
 */
async function fetchAppDetails(appId) {
  try {
    const response = await fetch(`${API_BASE}/api/apps/${appId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching app ${appId}:`, error);
    throw error;
  }
}

/**
 * جلب حالة صحة البوابة نفسها
 * @returns {Promise<Object>} حالة البوابة
 */
async function fetchGatewayHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching gateway health:', error);
    throw error;
  }
}