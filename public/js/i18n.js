/**
 * i18n.js - نظام الترجمة الديناميكي
 * يدعم التبديل بين اللغات دون إعادة تحميل الصفحة
 */

class I18n {
  constructor() {
    this.currentLocale = 'ar';
    this.translations = {};
    this.observers = [];
    this.isLoaded = false;
  }

  /**
   * تحميل ملف الترجمة للغة المحددة
   */
  async loadLocale(locale) {
    try {
      const response = await fetch(`/locales/${locale}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load locale: ${locale}`);
      }
      const data = await response.json();
      this.translations[locale] = data;
      this.currentLocale = locale;
      this.isLoaded = true;
      
      // تحديث اتجاه الصفحة
      this.updateDirection(locale);
      
      // إعلام المراقبين
      this.notifyObservers();
      
      return data;
    } catch (error) {
      console.error('Error loading locale:', error);
      // محاولة تحميل اللغة الافتراضية (العربية)
      if (locale !== 'ar') {
        return this.loadLocale('ar');
      }
      throw error;
    }
  }

  /**
   * تحديث اتجاه الصفحة (RTL/LTR)
   */
  updateDirection(locale) {
    const isRTL = locale === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    
    // تحديث سمة dir على الجسم أيضاً
    document.body.dir = isRTL ? 'rtl' : 'ltr';
  }

  /**
   * الحصول على ترجمة مفتاح مع دعم التداخل (nested keys)
   * مثال: t('app.title') -> "🦅 البوابة السيادية الموحدة"
   */
  t(key, params = {}) {
    if (!this.isLoaded || !this.translations[this.currentLocale]) {
      return key; // إرجاع المفتاح إذا لم تكن الترجمة محملة
    }

    const keys = key.split('.');
    let value = this.translations[this.currentLocale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    // استبدال المتغيرات في النص
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] || match;
      });
    }

    return value;
  }

  /**
   * تسجيل مراقب (observer) ليتم استدعاؤه عند تغيير اللغة
   */
  addObserver(callback) {
    if (typeof callback === 'function') {
      this.observers.push(callback);
    }
  }

  /**
   * إعلام جميع المراقبين بتغيير اللغة
   */
  notifyObservers() {
    for (const callback of this.observers) {
      try {
        callback(this.currentLocale, this.translations[this.currentLocale]);
      } catch (error) {
        console.error('Error in i18n observer:', error);
      }
    }
  }

  /**
   * تغيير اللغة الحالية
   */
  async setLocale(locale) {
    if (locale === this.currentLocale && this.isLoaded) {
      return this.translations[locale];
    }
    
    if (!this.translations[locale]) {
      await this.loadLocale(locale);
    } else {
      this.currentLocale = locale;
      this.updateDirection(locale);
      this.notifyObservers();
    }
    
    // حفظ التفضيل
    try {
      localStorage.setItem('preferred-language', locale);
    } catch (e) {
      // تجاهل
    }
    
    return this.translations[locale];
  }

  /**
   * الحصول على اللغة الحالية
   */
  getLocale() {
    return this.currentLocale;
  }

  /**
   * تهيئة النظام مع اللغة المفضلة
   */
  async init() {
    // محاولة استعادة اللغة المفضلة
    let preferredLocale = 'ar';
    try {
      const saved = localStorage.getItem('preferred-language');
      if (saved && (saved === 'ar' || saved === 'en')) {
        preferredLocale = saved;
      }
    } catch (e) {
      // تجاهل
    }
    
    await this.loadLocale(preferredLocale);
    return this;
  }
}

// ===== إنشاء مثال عام =====
const i18n = new I18n();

// ===== دالة مساعدة للترجمة في أي مكان =====
function t(key, params = {}) {
  return i18n.t(key, params);
}

// ===== تصدير للاستخدام =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { i18n, t };
}