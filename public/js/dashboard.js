// =============================================
// لوحة التحكم – حالة الخدمات
// =============================================

// قائمة الخدمات (مطابقة لسجل الخدمات في server.js)
const services = [
    { key: 'bigish-yer', name: 'BIGISH-YER', url: process.env.BIGISH_YER_URL || '' },
    { key: 'gav', name: 'GAV Incense Route', url: '' },
    { key: 'ajyal', name: 'AJYAL', url: '' },
    { key: 'auction', name: 'Suppliers Auction', url: '' },
    { key: 'cobra', name: 'COBRA Protocol', url: '' },
    { key: 'aman', name: 'AMAN Protocol', url: '' },
    { key: 'bewell', name: 'Be Well', url: '' },
    { key: 'telcom', name: 'Telcom Protocol', url: '' },
    { key: 'aecfund', name: 'AEC Fund', url: '' }
];

// تحديث حالة الخدمات
function refreshServices() {
    const grid = document.getElementById('services-grid');
    grid.innerHTML = '<div>جاري تحميل حالة الخدمات...</div>';

    // جلب الحالة من الخادم
    fetch('/api/status')
        .then(response => response.json())
        .then(data => {
            renderServices(data.services);
        })
        .catch(() => {
            // في حال فشل الاتصال، عرض الخدمات كـ offline
            renderServices(services.map(s => ({ key: s.key, status: 'offline' })));
        });
}

// عرض الخدمات في الشبكة
function renderServices(serviceStatuses) {
    const grid = document.getElementById('services-grid');
    grid.innerHTML = '';

    serviceStatuses.forEach(s => {
        const service = services.find(svc => svc.key === s.key) || { name: s.key };
        const statusClass = s.status === 'online' ? 'online' : 'offline';
        const statusText = s.status === 'online' ? '🟢 يعمل' : '🔴 غير متاح';

        const card = document.createElement('div');
        card.className = `service-card ${statusClass}`;
        card.innerHTML = `
            <div class="name">${service.name}</div>
            <span class="status-badge ${statusClass}">${statusText}</span>
        `;
        grid.appendChild(card);
    });
}

// تحديث تلقائي كل 30 ثانية
setInterval(refreshServices, 30000);

// تحميل أولي عند تشغيل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // إذا كان المستخدم مسجلاً بالفعل، نحمّل الحالة
    if (document.getElementById('dashboard-section').style.display === 'block') {
        refreshServices();
    }
});