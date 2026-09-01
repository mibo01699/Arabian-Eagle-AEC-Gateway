// تكوين موحد للتطبيقات (يجب مزامنته مع ملف التكوين الخادمي)
const APP_CONFIG = [
  {
    id: 'bigish-yer',
    name: 'BIGISH-YER',
    description: 'طبقة التسوية المالية الأساسية',
    url: 'https://bigish-yer.example.com', // سيتم استبداله بالرابط الفعلي
    healthEndpoint: 'https://bigish-yer.example.com/api/health',
    category: 'financial'
  },
  // ... باقي التطبيقات (GAV, AJYAL, suppliers-auction, COBRA, Be-well, AMAN, AEC-Fund, Telcom)
];

// دالة لجلب الحالة الصحية لكل تطبيق
async function fetchAppStatus(app) {
  try {
    const response = await fetch(app.healthEndpoint, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const data = await response.json();
      return data.status || 'ONLINE';
    }
    return 'DEGRADED';
  } catch {
    return 'OFFLINE';
  }
}

// دالة لعرض البطاقات
async function renderDashboard() {
  const grid = document.getElementById('appsGrid');
  const loading = document.getElementById('loadingIndicator');
  const errorDiv = document.getElementById('errorMessage');
  loading.style.display = 'block';
  errorDiv.classList.add('hidden');

  try {
    const statuses = await Promise.all(APP_CONFIG.map(app => fetchAppStatus(app)));
    grid.innerHTML = APP_CONFIG.map((app, i) => `
      <div class="app-card" role="article" aria-label="${app.name}">
        <div class="app-header">
          <h2>${app.name}</h2>
          <span class="status-badge status-${statuses[i].toLowerCase()}">${statuses[i]}</span>
        </div>
        <p>${app.description}</p>
        <div class="app-footer">
          <a href="${app.url !== 'NOT_DEPLOYED' ? app.url : '#'}" 
             target="_blank" 
             rel="noopener noreferrer"
             class="${app.url === 'NOT_DEPLOYED' ? 'disabled-link' : ''}">
            ${app.url !== 'NOT_DEPLOYED' ? 'زيارة التطبيق' : 'غير منشور'}
          </a>
        </div>
      </div>
    `).join('');
  } catch (error) {
    errorDiv.classList.remove('hidden');
    console.error('فشل تحميل لوحة التحكم:', error);
  } finally {
    loading.style.display = 'none';
  }
}

// تبديل اللغة (RTL/LTR)
document.getElementById('langToggle').addEventListener('click', function() {
  const isRtl = document.documentElement.dir === 'rtl';
  document.documentElement.dir = isRtl ? 'ltr' : 'rtl';
  document.documentElement.lang = isRtl ? 'en' : 'ar';
  this.textContent = isRtl ? 'عربي' : 'English';
});

// التحميل الأولي
document.addEventListener('DOMContentLoaded', renderDashboard);
document.getElementById('refreshBtn').addEventListener('click', renderDashboard);