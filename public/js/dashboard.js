/**
 * dashboard.js - منطق عرض لوحة التحكم وتحديثها
 */

// ===== عناصر DOM =====
const elements = {
  appsGrid: document.getElementById('appsGrid'),
  totalApps: document.getElementById('totalApps'),
  onlineApps: document.getElementById('onlineApps'),
  degradedApps: document.getElementById('degradedApps'),
  offlineApps: document.getElementById('offlineApps'),
  systemStatus: document.getElementById('systemStatus'),
  statusDot: document.querySelector('.status-dot'),
  statusText: document.querySelector('.status-text'),
  lastUpdate: document.getElementById('lastUpdate'),
  refreshBtn: document.getElementById('refreshBtn'),
  langToggle: document.getElementById('langToggle'),
};

// ===== حالة التطبيق =====
let currentLanguage = 'ar'; // 'ar' أو 'en'
let refreshInterval = null;

// ===== دوال العرض =====

/**
 * عرض بطاقات التطبيقات في الشبكة
 */
function renderApps(apps) {
  if (!apps || apps.length === 0) {
    elements.appsGrid.innerHTML = `
      <div class="no-apps">
        <div class="no-apps-icon">📭</div>
        <p>لا توجد تطبيقات مسجلة حالياً</p>
      </div>
    `;
    return;
  }

  elements.appsGrid.innerHTML = apps.map(app => {
    const statusClass = app.status.toLowerCase();
    const badgeClass = `badge-${statusClass}`;
    
    return `
      <div class="app-card status-${statusClass}" data-app-id="${app.id}">
        <div class="app-card-header">
          <span class="app-icon">${app.icon || '📦'}</span>
          <span class="app-status-badge ${badgeClass}">${app.status}</span>
        </div>
        <div class="app-name">${app.name}</div>
        <div class="app-description">${app.description || 'لا يوجد وصف'}</div>
        <div class="app-meta">
          <span class="app-category">${app.category || 'عام'}</span>
          <span class="app-url" title="${app.url || 'غير منشور'}">${app.url ? new URL(app.url).hostname : 'غير منشور'}</span>
        </div>
      </div>
    `;
  }).join('');

  // إضافة مستمعي أحداث للبطاقات (فتح التطبيق عند النقر)
  document.querySelectorAll('.app-card').forEach(card => {
    card.addEventListener('click', () => {
      const appId = card.dataset.appId;
      const app = apps.find(a => a.id === appId);
      if (app && app.url) {
        window.open(app.url, '_blank');
      } else {
        // إظهار تنبيه إذا كان التطبيق غير منشور
        showToast('هذا التطبيق غير منشور بعد', 'warning');
      }
    });
  });
}

/**
 * تحديث بطاقات الملخص
 */
function updateSummary(summary) {
  if (!summary) return;
  
  elements.totalApps.textContent = summary.total || 0;
  elements.onlineApps.textContent = summary.online || 0;
  elements.degradedApps.textContent = summary.degraded || 0;
  elements.offlineApps.textContent = summary.offline || 0;
}

/**
 * تحديث حالة المنظومة العامة
 */
function updateSystemStatus(overallStatus, timestamp) {
  const statusMap = {
    'HEALTHY': { dot: 'healthy', text: '✅ المنظومة تعمل بكامل طاقتها', emoji: '✅' },
    'DEGRADED': { dot: 'degraded', text: '⚠️ بعض التطبيقات تعاني من مشاكل', emoji: '⚠️' },
    'OFFLINE': { dot: 'offline', text: '❌ المنظومة غير متصلة', emoji: '❌' },
  };

  const status = statusMap[overallStatus] || statusMap['DEGRADED'];
  
  // تحديث النقطة
  elements.statusDot.className = `status-dot ${status.dot}`;
  
  // تحديث النص
  elements.statusText.textContent = status.text;
  
  // تحديث الوقت
  if (timestamp) {
    const date = new Date(timestamp);