/**
 * pi-sdk.js - تكامل Pi Network SDK
 * مع التحقق من جانب الخادم (Server-Side)
 */

// ===== عناصر DOM =====
const elements = {
  loginButton: document.getElementById('loginButton'),
  logoutButton: document.getElementById('logoutButton'),
  statusIndicator: document.getElementById('statusIndicator'),
  userInfo: document.getElementById('userInfo'),
  username: document.getElementById('username'),
  walletAddress: document.getElementById('walletAddress'),
  balance: document.getElementById('balance'),
};

// ===== حالة Pi =====
let piUser = null;
let isAuthenticated = false;

// ===== دالة لتحديث واجهة المستخدم =====
function updateUI() {
  const dot = elements.statusIndicator?.querySelector('.status-dot');
  const label = elements.statusIndicator?.querySelector('.status-label');
  
  if (isAuthenticated && piUser) {
    if (dot) dot.className = 'status-dot online';
    if (label) label.textContent = '✅ تم المصادقة';
    if (elements.loginButton) elements.loginButton.style.display = 'none';
    if (elements.logoutButton) elements.logoutButton.style.display = 'inline-flex';
    if (elements.userInfo) elements.userInfo.style.display = 'block';
    
    if (elements.username) elements.username.textContent = piUser.username || 'Unknown';
    if (elements.walletAddress) elements.walletAddress.textContent = piUser.walletAddress || 'N/A';
    if (elements.balance) elements.balance.textContent = piUser.balance ? `${piUser.balance} π` : '0 π';
  } else {
    if (dot) dot.className = 'status-dot offline';
    if (label) label.textContent = '❌ غير مصادق';
    if (elements.loginButton) elements.loginButton.style.display = 'inline-flex';
    if (elements.logoutButton) elements.logoutButton.style.display = 'none';
    if (elements.userInfo) elements.userInfo.style.display = 'none';
  }
}

// ===== دالة عرض الإشعارات =====
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.textContent = message;
  const colors = { error: '#fc8181', warning: '#ed8936', info: '#48bb78' };
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

// ===== دالة تسجيل الخروج =====
function logoutFromPi() {
  piUser = null;
  isAuthenticated = false;
  updateUI();
  showToast('تم تسجيل الخروج بنجاح', 'info');
}

// ===== دالة المصادقة الرئيسية =====
async function authenticateWithPi() {
  console.log('🔄 بدء عملية المصادقة مع Pi Network...');
  
  // التحقق من وجود Pi SDK
  if (typeof Pi === 'undefined') {
    console.error('❌ Pi SDK غير محمل');
    showToast('Pi SDK غير محمل. تأكد من اتصال الإنترنت.', 'error');
    return;
  }

  try {
    // تهيئة Pi SDK
    Pi.init({
      version: "2.0",
      sandbox: true // استخدم false في الإنتاج
    });

    // عرض حالة التحميل
    const dot = elements.statusIndicator?.querySelector('.status-dot');
    const label = elements.statusIndicator?.querySelector('.status-label');
    if (dot) dot.className = 'status-dot pending';
    if (label) label.textContent = '⏳ جاري المصادقة...';

    // طلب المصادقة
    console.log('📤 طلب مصادقة من Pi SDK...');
    const authResult = await Pi.authenticate(['username', 'wallet_address']);
    console.log('📥 استجابة Pi SDK:', authResult);

    if (!authResult || !authResult.accessToken) {
      throw new Error('لم يتم استلام رمز المصادقة');
    }

    // إرسال التوكن للخادم
    console.log('📤 إرسال التوكن للخادم...');
    const response = await fetch('/api/auth/pi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: authResult.accessToken,
      }),
    });

    const data = await response.json();
    console.log('📥 استجابة الخادم:', data);

    if (data.success) {
      piUser = data.user;
      isAuthenticated = true;
      updateUI();
      showToast('✅ تم تسجيل الدخول بنجاح عبر Pi Network', 'info');
      console.log('✅ المصادقة ناجحة للمستخدم:', piUser.username);
    } else {
      throw new Error(data.error || 'فشلت المصادقة في الخادم');
    }

  } catch (error) {
    console.error('❌ خطأ في المصادقة:', error);
    showToast(error.message || 'فشلت المصادقة. حاول مرة أخرى.', 'error');
    logoutFromPi();
  }
}

// ===== تهيئة الصفحة =====
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔐 تهيئة صفحة مصادقة Pi...');
  
  // تحديث الواجهة
  updateUI();
  
  // مستمعي الأحداث
  const loginBtn = document.getElementById('loginButton');
  const logoutBtn = document.getElementById('logoutButton');
  const langToggle = document.getElementById('langToggle');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', authenticateWithPi);
    console.log('✅ زر تسجيل الدخول مرتبط');
  } else {
    console.error('❌ زر تسجيل الدخول غير موجود');
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutFromPi);
    console.log('✅ زر تسجيل الخروج مرتبط');
  }
  
  if (langToggle) {
    langToggle.addEventListener('click', function() {
      const isRTL = document.documentElement.dir === 'rtl';
      document.documentElement.dir = isRTL ? 'ltr' : 'rtl';
      document.documentElement.lang = isRTL ? 'en' : 'ar';
      showToast(isRTL ? 'Switched to English' : 'تم التبديل إلى العربية', 'info');
    });
  }
  
  console.log('🔐 صفحة مصادقة Pi جاهزة');
});

// ===== تصدير الدوال للاستخدام العالمي =====
window.authenticateWithPi = authenticateWithPi;
window.logoutFromPi = logoutFromPi;