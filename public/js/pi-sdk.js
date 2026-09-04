/**
 * pi-sdk.js - تكامل Pi Network SDK
 * وفق وثائق Pi Network الرسمية
 */

// ===== عناصر DOM =====
const elements = {
  langToggle: document.getElementById('langToggle'),
  loginButton: document.getElementById('loginButton'),
  logoutButton: document.getElementById('logoutButton'),
  statusIndicator: document.getElementById('statusIndicator'),
  userInfo: document.getElementById('userInfo'),
  username: document.getElementById('username'),
  walletAddress: document.getElementById('walletAddress'),
  balance: document.getElementById('balance'),
  paymentSection: document.getElementById('paymentSection'),
  paymentForm: document.getElementById('paymentForm'),
  paymentAmount: document.getElementById('paymentAmount'),
  paymentDescription: document.getElementById('paymentDescription'),
  paymentMemo: document.getElementById('paymentMemo'),
  cancelPayment: document.getElementById('cancelPayment'),
  transactionHistory: document.getElementById('transactionHistory'),
  transactionList: document.getElementById('transactionList'),
};

// ===== حالة Pi =====
let piUser = null;
let piAccessToken = null;
let isAuthenticated = false;
let transactions = [];

// ===== تهيئة i18n =====
async function initI18n() {
  await i18n.init();
  const currentLocale = i18n.getLocale();
  elements.langToggle.innerHTML = `<i class="fas fa-${currentLocale === 'ar' ? 'globe' : 'globe-americas'}"></i>`;
  updateI18nElements();
}

function updateI18nElements() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const translation = i18n.t(key);
    if (translation && translation !== key) {
      el.textContent = translation;
    }
  });
  document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
    const key = el.dataset.i18nTooltip;
    const translation = i18n.t(key);
    if (translation && translation !== key) {
      el.title = translation;
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const translation = i18n.t(key);
    if (translation && translation !== key) {
      el.placeholder = translation;
    }
  });
}

// ===== تبديل اللغة =====
async function toggleLanguage() {
  const currentLocale = i18n.getLocale();
  const newLocale = currentLocale === 'ar' ? 'en' : 'ar';
  await i18n.setLocale(newLocale);
  elements.langToggle.innerHTML = `<i class="fas fa-${newLocale === 'ar' ? 'globe' : 'globe-americas'}"></i>`;
  updateI18nElements();
  updateUI();
  showToast(i18n.t(`toast.switchedTo${newLocale === 'ar' ? 'Arabic' : 'English'}`), 'info');
}

// ===== إشعارات =====
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

// ===== تحديث واجهة المستخدم =====
function updateUI() {
  const dot = elements.statusIndicator.querySelector('.status-dot');
  const label = elements.statusIndicator.querySelector('.status-label');
  
  if (isAuthenticated && piUser) {
    dot.className = 'status-dot online';
    label.textContent = i18n.t('pi.status.authenticated');
    elements.loginButton.style.display = 'none';
    elements.logoutButton.style.display = 'inline-flex';
    elements.userInfo.style.display = 'block';
    elements.paymentSection.style.display = 'block';
    elements.transactionHistory.style.display = 'block';
    
    // عرض معلومات المستخدم
    elements.username.textContent = piUser.username || 'Unknown';
    elements.walletAddress.textContent = piUser.walletAddress || 'N/A';
    elements.balance.textContent = piUser.balance ? `${piUser.balance} π` : '0 π';
    
    // عرض سجل المعاملات
    renderTransactions();
  } else {
    dot.className = 'status-dot offline';
    label.textContent = i18n.t('pi.status.unauthenticated');
    elements.loginButton.style.display = 'inline-flex';
    elements.logoutButton.style.display = 'none';
    elements.userInfo.style.display = 'none';
    elements.paymentSection.style.display = 'none';
    elements.transactionHistory.style.display = 'none';
  }
}

// ===== عرض سجل المعاملات =====
function renderTransactions() {
  if (transactions.length === 0) {
    elements.transactionList.innerHTML = `<p style="color: var(--text-muted);">${i18n.t('transactionHistory') || 'لا توجد معاملات بعد'}</p>`;
    return;
  }
  
  elements.transactionList.innerHTML = transactions.map(tx => `
    <div class="transaction-item">
      <span>
        <strong>${tx.description || 'معاملة'}</strong>
        <span class="tx-date">${new Date(tx.timestamp).toLocaleDateString()}</span>
      </span>
      <span class="tx-amount ${tx.amount >= 0 ? 'positive' : 'negative'}">
        ${tx.amount >= 0 ? '+' : ''}${tx.amount} π
      </span>
    </div>
  `).join('');
}

// ===== مصادقة Pi Network =====
async function authenticateWithPi() {
  try {
    // التحقق من وجود Pi SDK
    if (typeof Pi === 'undefined') {
      showToast(i18n.t('pi.errors.sdkNotLoaded'), 'error');
      return;
    }

    // تهيئة Pi SDK
    Pi.init({
      version: "2.0",
      sandbox: true // استخدم false في الإنتاج
    });

    // طلب المصادقة
    const authResult = await Pi.authenticate(['username', 'wallet_address'], (error) => {
      if (error) {
        console.error('Pi authentication error:', error);
        showToast(i18n.t('pi.errors.authFailed'), 'error');
      }
    });

    if (authResult && authResult.user) {
      piUser = authResult.user;
      piAccessToken = authResult.accessToken;
      isAuthenticated = true;
      
      // جلب الرصيد (محاكاة - سيتم ربطه بـ API حقيقي)
      piUser.balance = await fetchBalance(piUser.walletAddress);
      
      updateUI();
      showToast(i18n.t('toast.pi.authSuccess'), 'info');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    showToast(i18n.t('pi.errors.authFailed'), 'error');
  }
}

// ===== جلب الرصيد (محاكاة) =====
async function fetchBalance(walletAddress) {
  // في الإنتاج، سيتم استدعاء API حقيقي
  return Math.floor(Math.random() * 1000) + 100;
}

// ===== تسجيل الخروج =====
function logoutFromPi() {
  piUser = null;
  piAccessToken = null;
  isAuthenticated = false;
  transactions = [];
  updateUI();
  showToast(i18n.t('toast.switchedToArabic'), 'info');
}

// ===== تنفيذ الدفع =====
async function processPayment(e) {
  e.preventDefault();
  
  if (!isAuthenticated || !piUser) {
    showToast(i18n.t('pi.errors.authFailed'), 'error');
    return;
  }

  const amount = parseFloat(elements.paymentAmount.value);
  const description = elements.paymentDescription.value || 'دفع عبر AEC Gateway';
  const memo = elements.paymentMemo.value || '';

  if (!amount || amount <= 0) {
    showToast(i18n.t('pi.errors.invalidAmount'), 'warning');
    return;
  }

  try {
    // استخدام BigInt للحفاظ على الدقة المالية
    const amountBigInt = BigInt(Math.round(amount * 1000000)); // تحويل إلى micro

    // عرض حالة المعالجة
    const dot = elements.statusIndicator.querySelector('.status-dot');
    const label = elements.statusIndicator.querySelector('.status-label');
    dot.className = 'status-dot pending';
    label.textContent = i18n.t('pi.status.pending');

    // إجراء الدفع عبر Pi SDK
    const paymentResult = await Pi.createPayment({
      amount: amount,
      memo: memo || description,
      metadata: {
        description: description,
        timestamp: new Date().toISOString(),
      }
    });

    if (paymentResult && paymentResult.txid) {
      // إضافة المعاملة إلى السجل
      transactions.push({
        id: paymentResult.txid,
        amount: -amount,
        description: description,
        timestamp: new Date().toISOString(),
        status: 'completed'
      });

      // تحديث الرصيد
      piUser.balance = (piUser.balance || 0) - amount;

      showToast(i18n.t('toast.pi.paymentSuccess'), 'info');
      updateUI();
    } else {
      throw new Error('Payment failed');
    }
  } catch (error) {
    console.error('Payment error:', error);
    showToast(i18n.t('pi.errors.paymentFailed'), 'error');
    updateUI();
  }
}

// ===== إلغاء الدفع =====
function cancelPayment() {
  elements.paymentForm.reset();
  showToast(i18n.t('toast.pi.paymentCancelled'), 'info');
}

// ===== تهيئة الصفحة =====
async function initPiAuth() {
  await initI18n();
  updateUI();

  // مستمعي الأحداث
  elements.langToggle.addEventListener('click', toggleLanguage);
  elements.loginButton.addEventListener('click', authenticateWithPi);
  elements.logoutButton.addEventListener('click', logoutFromPi);
  elements.paymentForm.addEventListener('submit', processPayment);
  elements.cancelPayment.addEventListener('click', cancelPayment);

  // التحقق من وجود Pi SDK
  if (typeof Pi === 'undefined') {
    console.warn('Pi SDK not loaded. Check your internet connection.');
  }

  console.log('🔐 Pi Authentication initialized');
}

document.addEventListener('DOMContentLoaded', initPiAuth);