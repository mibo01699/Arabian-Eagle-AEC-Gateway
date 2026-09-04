/**
 * dashboard.js - مع دعم i18n
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
let refreshInterval = null;

// ===== دالة لتحديث النصوص المترجمة في DOM =====
function updateI18nElements() {
  // تحديث جميع العناصر التي تحمل data-i18n
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    const translation = i18n.t(key);
    if (translation && translation !== key) {
      element.textContent = translation;
    }
  });
  
  // تحديث عناوين الأدوات (tooltips)
  document.querySelectorAll('[data-i18n-tooltip]').forEach(element => {
    const key = element.dataset.i18nTooltip;
    const translation = i18n.t(key);
    if (translation && translation !== key) {
      element.title = translation;
    }
  });
}

// ===== عرض بطاقات التطبيقات مع الترجمة =====
function renderApps(apps) {
  if (!apps || apps.length === 0) {
    elements.appsGrid.innerHTML = `
      <div class="no-apps">
        <div class="no-apps-icon">📭</div>
        <p>${i18n.t('appCard.noDescription')}</p>
      </div>
    `;
    return;
  }

  // ترجمة أسماء الفئات
  const categoryMap = {
    'financial': i18n.t('appCard.category.financial'),
    'health': i18n.t('appCard.category.health'),
    'social': i18n.t('appCard.category.social'),
    'commerce': i18n.t('appCard.category.commerce'),
    'government': i18n.t('appCard.category.government'),
    'communications': i18n.t('appCard.category.communications'),
    'insurance': i18n.t('appCard.category.insurance'),
  };

  elements.appsGrid.innerHTML = apps.map(app => {
    const statusClass = app.status.toLowerCase();
    const badgeClass = `badge-${statusClass}`;
    const categoryName = categoryMap[app.category] || i18n.t('appCard.category.general');
    
    return `
      <div class="app-card status-${statusClass}" data-app-id="${app.id}">
        <div class="app-card-header">
          <span class="app-icon">${app.icon || '📦'}</span>
          <span class="app-status-badge ${badgeClass}">${app.status}</span>
        </div>
        <div class="app-name">${app.name}</div>
        <div class="app-description">${app.description || i18n.t('appCard.noDescription')}</div>
        <div class="app-meta">
          <span class="app-category">${categoryName}</span>
          <span class="app-url" title="${app.url || i18n.t('appCard.notDeployed')}">${app.url ? new URL(app.url).hostname : i18n.t('appCard.notDeployed')}</span>
        </div>
      </div>
    `;
  }).join('');

  // إضافة مستمعي أحداث للبطاقات
  document.querySelectorAll('.app-card').forEach(card => {
    card.addEventListener('click', () => {
      const appId = card.dataset.appId;
      const app = apps.find(a => a.id === appId);
      if (app && app.url) {
        window.open(app.url, '_blank');
      } else {
        showToast(i18n.t('toast.appNotDeployed'), 'warning');
      }
    });
  });
}

// ===== تحديث بطاقات الملخص =====
function updateSummary(summary) {
  if (!summary) return;
  
  elements.totalApps.textContent = summary.total || 0;
  elements.onlineApps.textContent = summary.online || 0;
  elements.degradedApps.textContent = summary.degraded || 0;
  elements.offlineApps.textContent = summary.offline || 0;
}

// ===== تحديث حالة المنظومة العامة =====
function updateSystemStatus(overallStatus, timestamp) {
  const statusMap = {
    'HEALTHY': { dot: 'healthy', text: i18n.t('status.healthy') },
    'DEGRADED': { dot: 'degraded', text: i18n.t('status.degraded') },
    'OFFLINE': { dot: 'offline', text: i18n.t('status.offline') },
  };

  const status = statusMap[overallStatus] || statusMap['DEGRADED'];
  
  elements.statusDot.className = `status-dot ${status.dot}`;
  elements.statusText.textContent = status.text;
  
  if (timestamp) {
    const date = new Date(timestamp);
    const locale = i18n.getLocale();
    const timeStr = date.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US');
    elements.lastUpdate.textContent = `${i18n.t('status.lastUpdate')}: ${timeStr}`;
  }
}

// ===== تحديث لوحة التحكم =====
async function refreshDashboard() {
  try {
    elements.refreshBtn.querySelector('i').className = 'fas fa-spinner fa-spin';
    elements.refreshBtn.disabled = true;
    
    const statusData = await fetchSystemStatus();
    
    renderApps(statusData.apps);
    updateSummary(statusData.summary);
    updateSystemStatus(statusData.overallStatus, statusData.timestamp);
    
    elements.refreshBtn.querySelector('i').className = 'fas fa-sync-alt';
    elements.refreshBtn.disabled = false;
    
    showToast(i18n.t('toast.refreshSuccess'), 'info');
    
  } catch (error) {
    console.error('Failed to refresh dashboard:', error);
    elements.refreshBtn.querySelector('i').className = 'fas fa-sync-alt';
    elements.refreshBtn.disabled = false;
    showToast(i18n.t('toast.refreshFailed'), 'error');
  }
}

// ===== إشعارات =====
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  const colors = {
    error: '#fc8181',
    warning: '#ed8936',
    info: '#48bb78'
  };
  
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: colors[type] || colors.info,
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    zIndex: '1000',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    maxWidth: '90%',
    textAlign: 'center',
    opacity: '0',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
  });
  
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== تبديل اللغة =====
async function toggleLanguage() {
  const currentLocale = i18n.getLocale();
  const newLocale = currentLocale === 'ar' ? 'en' : 'ar';
  
  await i18n.setLocale(newLocale);
  
  // تحديث أيقونة الزر
  elements.langToggle.innerHTML = `<i class="fas fa-${newLocale === 'ar' ? 'globe' : 'globe-americas'}"></i>`;
  
  // تحديث جميع النصوص المترجمة في الصفحة
  updateI18nElements();
  
  // إعادة عرض التطبيقات مع اللغة الجديدة
  try {
    const statusData = await fetchSystemStatus();
    renderApps(statusData.apps);
    updateSystemStatus(statusData.overallStatus, statusData.timestamp);
  } catch (error) {
    console.error('Failed to refresh after language change:', error);
  }
  
  showToast(i18n.t(`toast.switchedTo${newLocale === 'ar' ? 'Arabic' : 'English'}`), 'info');
}

// ===== بدء التحديث التلقائي =====
function startAutoRefresh(intervalSeconds = 30) {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshDashboard();
  refreshInterval = setInterval(refreshDashboard, intervalSeconds * 1000);
}

// ===== تهيئة لوحة التحكم =====
async function initDashboard() {
  // تهيئة i18n أولاً
  await i18n.init();
  
  // تحديث أيقونة اللغة
  const currentLocale = i18n.getLocale();
  elements.langToggle.innerHTML = `<i class="fas fa-${currentLocale === 'ar' ? 'globe' : 'globe-americas'}"></i>`;
  
  // تحديث النصوص المترجمة
  updateI18nElements();
  
  // مستمعي الأحداث
  elements.refreshBtn.addEventListener('click', refreshDashboard);
  elements.langToggle.addEventListener('click', toggleLanguage);
  
  // إضافة مراقب لتحديث النصوص عند تغيير اللغة
  i18n.addObserver(() => {
    updateI18nElements();
  });
  
  // بدء التحديث التلقائي
  startAutoRefresh(30);
  
  // تحديث عند عودة التركيز
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refreshDashboard();
    }
  });
  
  console.log('🦅 AEC Gateway Dashboard initialized with i18n');
}

// ===== تشغيل عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', initDashboard);