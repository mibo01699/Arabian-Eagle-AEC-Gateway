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