/**
 * support.js - منطق مركز الدعم
 */

// ===== عناصر DOM =====
const elements = {
  langToggle: document.getElementById('langToggle'),
  refreshBtn: document.getElementById('refreshBtn'),
  supportCards: document.querySelectorAll('.support-card'),
  faqSection: document.getElementById('faqSection'),
  chatSection: document.getElementById('chatSection'),
  ticketSection: document.getElementById('ticketSection'),
  faqItems: document.querySelectorAll('.faq-item'),
  chatInput: document.getElementById('chatInput'),
  sendMessageBtn: document.getElementById('sendMessageBtn'),
  chatMessages: document.getElementById('chatMessages'),
  ticketForm: document.getElementById('ticketForm'),
};

// ===== حالة المحادثة =====
const chatState = {
  messages: [],
  isTyping: false,
};

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

// ===== عرض/إخفاء الأقسام =====
function showSection(sectionId) {
  document.querySelectorAll('.support-section').forEach(el => el.style.display = 'none');
  if (sectionId === 'faq') elements.faqSection.style.display = 'block';
  else if (sectionId === 'chat') elements.chatSection.style.display = 'block';
  else if (sectionId === 'ticket') elements.ticketSection.style.display = 'block';
}

// ===== الأسئلة الشائعة =====
function initFaq() {
  elements.faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      elements.faqItems.forEach(el => el.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });
}

// ===== المحادثة =====
function addMessage(text, sender = 'bot') {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  messageDiv.innerHTML = `<span class="message-text">${text}</span>`;
  elements.chatMessages.appendChild(messageDiv);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  chatState.messages.push({ text, sender });
}

function showTyping() {
  const typingDiv = document