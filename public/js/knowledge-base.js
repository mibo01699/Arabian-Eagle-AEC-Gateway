/**
 * knowledge-base.js - منطق قاعدة المعرفة
 */

// ===== عناصر DOM =====
const elements = {
  langToggle: document.getElementById('langToggle'),
  refreshBtn: document.getElementById('refreshBtn'),
  searchInput: document.getElementById('searchInput'),
  categoriesTabs: document.getElementById('categoriesTabs'),
  articlesGrid: document.getElementById('articlesGrid'),
  articleModal: document.getElementById('articleModal'),
  modalBody: document.getElementById('modalBody'),
  modalClose: document.getElementById('modalClose'),
};

// ===== الحالة =====
let knowledgeData = { articles: [] };
let currentCategory = 'all';
let currentSearch = '';

// ===== تحميل البيانات =====
async function loadKnowledgeData() {
  try {
    const response = await fetch('/data/knowledge.json');
    if (!response.ok) throw new Error('Failed to load knowledge data');
    knowledgeData = await response.json();
    return knowledgeData;
  } catch (error) {
    console.error('Error loading knowledge data:', error);
    return { articles: [] };
  }
}

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
  
  // تحديث التصنيفات
  document.querySelectorAll('.category-tab').forEach(btn => {
    const key = btn.dataset.i18n;
    if (key) {
      const translation = i18n.t(key);
      if (translation && translation !== key) {
        btn.textContent = translation;
      }
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
  renderArticles();
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

// ===== عرض المقالات =====
function renderArticles() {
  const isArabic = i18n.getLocale() === 'ar';
  let filtered = knowledgeData.articles;

  // تصفية حسب التصنيف
  if (currentCategory !== 'all') {
    filtered = filtered.filter(a => a.category === currentCategory);
  }

  // تصفية حسب البحث
  if (currentSearch.trim()) {
    const searchLower = currentSearch.toLowerCase().trim();
    filtered = filtered.filter(a => {
      const title = isArabic ? a.title : a.titleEn;
      const content = a.content;
      return title.toLowerCase().includes(searchLower) || 
             content.toLowerCase().includes(searchLower);
    });
  }

  // عرض المقالات
  if (filtered.length === 0) {
    elements.articlesGrid.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>${i18n.t('toast.knowledge.searchNoResults')}</p>
      </div>
    `;
    return;
  }

  elements.articlesGrid.innerHTML = filtered.map(article => {
    const title = isArabic ? article.title : article.titleEn;
    const categoryLabel = i18n.t(`knowledge.categoryLabels.${article.category}`);
    const contentPreview = article.content.substring(0, 120) + '...';
    
    return `
      <div class="article-card" data-id="${article.id}">
        <span class="article-category">${categoryLabel}</span>
        <div class="article-title">${title}</div>
        <div class="article-excerpt">${contentPreview}</div>
        <div class="article-meta">
          <span>📖 ${article.readTime} ${i18n.t('knowledge.readTime')}</span>
          <span>📅 ${article.lastUpdated}</span>
        </div>
      </div>
    `;
  }).join('');

  // إضافة مستمعي الأحداث للبطاقات
  document.querySelectorAll('.article-card').forEach(card => {
    card.addEventListener('click', () => {
      const articleId = card.dataset.id;
      const article = knowledgeData.articles.find(a => a.id === articleId);
      if (article) {
        openArticleModal(article);
      }
    });
  });
}

// ===== فتح منبثق المقال =====
function openArticleModal(article) {
  const isArabic = i18n.getLocale() === 'ar';
  const title = isArabic ? article.title : article.titleEn;
  const categoryLabel = i18n.t(`knowledge.categoryLabels.${article.category}`);
  const content = article.content;

  // تحويل النص إلى HTML مع فواصل الأسطر
  const formattedContent = content.split('\n').map(line => {
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)[0].length;
      const text = line.replace(/^#+\s*/, '');
      return `<h${level}>${text}</h${level}>`;
    }
    if (line.startsWith('- ')) {
      return `<li>${line.substring(2)}</li>`;
    }
    if (line.trim() === '') {
      return '<br>';
    }
    return `<p>${line}</p>`;
  }).join('');

  elements.modalBody.innerHTML = `
    <div class="article-title-large">${title}</div>
    <div class="article-meta-large">
      <span>📂 ${categoryLabel}</span>
      <span>📖 ${article.readTime} ${i18n.t('knowledge.readTime')}</span>
      <span>📅 ${i18n.t('knowledge.lastUpdated')}: ${article.lastUpdated}</span>
    </div>
    <div class="article-content">${formattedContent}</div>
  `;

  elements.articleModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// ===== إغلاق المنبثق =====
function closeArticleModal() {
  elements.articleModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// ===== تهيئة الصفحة =====
async function initKnowledgeBase() {
  // تحميل البيانات
  await loadKnowledgeData();
  
  // تهيئة i18n
  await initI18n();

  // عرض المقالات
  renderArticles();

  // مستمعي الأحداث
  elements.langToggle.addEventListener('click', toggleLanguage);
  elements.refreshBtn.addEventListener('click', () => {
    renderArticles();
    showToast(i18n.t('toast.refreshSuccess'), 'info');
  });

  // البحث
  elements.searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderArticles();
  });

  // التصنيفات
  document.querySelectorAll('.category-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      renderArticles();
    });
  });

  // إغلاق المنبثق
  elements.modalClose.addEventListener('click', closeArticleModal);
  elements.articleModal.addEventListener('click', (e) => {
    if (e.target === elements.articleModal) {
      closeArticleModal();
    }
  });

  // زر ESC لإغلاق المنبثق
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeArticleModal();
    }
  });

  console.log('📚 Knowledge Base initialized');
}

document.addEventListener('DOMContentLoaded', initKnowledgeBase);