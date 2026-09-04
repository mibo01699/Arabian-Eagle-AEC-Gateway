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
    elements.lastUpdate.textContent = `آخر تحديث: ${date.toLocaleTimeString('ar-SA')}`;
  }
}

/**
 * تحديث لوحة التحكم بالكامل
 */
async function refreshDashboard() {
  try {
    // إظهار حالة التحميل
    elements.refreshBtn.querySelector('i').className = 'fas fa-spinner fa-spin';
    elements.refreshBtn.disabled = true;
    
    // جلب البيانات
    const statusData = await fetchSystemStatus();
    
    // تحديث العناصر
    renderApps(statusData.apps);
    updateSummary(statusData.summary);
    updateSystemStatus(statusData.overallStatus, statusData.timestamp);
    
    // إعادة زر التحديث
    elements.refreshBtn.querySelector('i').className = 'fas fa-sync-alt';
    elements.refreshBtn.disabled = false;
    
  } catch (error) {
    console.error('Failed to refresh dashboard:', error);
    elements.refreshBtn.querySelector('i').className = 'fas fa-sync-alt';
    elements.refreshBtn.disabled = false;
    
    // عرض رسالة خطأ
    showToast('فشل تحديث البيانات. تأكد من اتصال الإنترنت.', 'error');
  }
}

// ===== إشعارات مؤقتة (Toast) =====

function showToast(message, type = 'info') {
  // إنشاء عنصر الإشعار
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // أنماط الإشعار
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: type === 'error' ? '#fc8181' : type === 'warning' ? '#ed8936' : '#48bb78',
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
  
  // ظهور الإشعار
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  
  // إخفاء الإشعار بعد 3 ثوانٍ
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== تبديل اللغة =====

function toggleLanguage() {
  currentLanguage = currentLanguage === 'ar' ? 'en' : 'ar';
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
  
  // تحديث النص على الزر
  elements.langToggle.innerHTML = `<i class="fas fa-${currentLanguage === 'ar' ? 'globe' : 'globe-americas'}"></i>`;
  
  // حفظ التفضيل
  try {
    localStorage.setItem('preferred-language', currentLanguage);
  } catch (e) {
    // تجاهل أخطاء التخزين المحلي
  }
  
  showToast(currentLanguage === 'ar' ? 'تم التبديل إلى العربية' : 'Switched to English', 'info');
}

// ===== بدء التحديث التلقائي =====

function startAutoRefresh(intervalSeconds = 30) {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  // تحديث فوري عند البداية
  refreshDashboard();
  
  // تحديث دوري
  refreshInterval = setInterval(refreshDashboard, intervalSeconds * 1000);
}

// ===== تهيئة لوحة التحكم =====

async function initDashboard() {
  // استعادة تفضيل اللغة
  try {
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang === 'en' || savedLang === 'ar') {
      currentLanguage = savedLang;
      document.documentElement.lang = currentLanguage;
      document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';
    }
  } catch (e) {
    // تجاهل
  }
  
  // تحديث أيقونة اللغة
  elements.langToggle.innerHTML = `<i class="fas fa-${currentLanguage === 'ar' ? 'globe' : 'globe-americas'}"></i>`;
  
  // مستمعي الأحداث
  elements.refreshBtn.addEventListener('click', refreshDashboard);
  elements.langToggle.addEventListener('click', toggleLanguage);
  
  // بدء التحديث التلقائي
  startAutoRefresh(30);
  
  // تحديث عند عودة التركيز على الصفحة
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      refreshDashboard();
    }
  });
  
  console.log('🦅 AEC Gateway Dashboard initialized');
}

// ===== تشغيل عند تحميل الصفحة =====
document.addEventListener('DOMContentLoaded', initDashboard);