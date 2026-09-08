# 🦅 Arabian Eagle AEC Gateway

**Gateway** هو المدخل الموحد لمنظومة Arabian Eagle المتكاملة المكونة من 9 تطبيقات خدمية تعمل ضمن نظام Pi Network البيئي.

---

## 📌 الحالة الحالية

| المكون | الحالة |
|--------|--------|
| **Gateway** | Foundation built; local development works. Deployment pending environment variable configuration. |
| **BIGISH-YER** | NOT_DEPLOYED (waiting for separate deployment) |
| **GAV, AJYAL, Suppliers Auction, COBRA, AMAN, Be-Well, TELCOM, AEC Fund** | NOT_DEPLOYED |
| **Pi Integration** | NOT_IMPLEMENTED |

---

## 🧱 البنية التقنية

- **اللغة:** JavaScript (Node.js v18+)
- **الإطار:** Express.js
- **الاستضافة:** Vercel (خطط للنشر)
- **قاعدة البيانات:** قيد التخطيط (Supabase)
- **التكامل مع Pi:** سيُنفذ في مرحلة لاحقة

---

## 📂 هيكل المشروع

```

arabian-eagle-aec-gateway/
├── server.js              # الخادم الرئيسي ونقاط النهاية
├── package.json           # الاعتماديات والنصوص البرمجية
├── .env.example           # نموذج متغيرات البيئة
├── vercel.json            # إعدادات النشر على Vercel
├── public/
│   └── index.html         # واجهة أولية (قيد التطوير)
├── tests/
│   ├── health.test.js     # اختبارات نقاط النهاية
│   ├── integration.test.js # اختبارات التكامل
│   └── security.test.js   # اختبارات الأمان
└── .github/workflows/
└── ci.yml             # CI عبر GitHub Actions

```

---

## 🚀 التشغيل المحلي

### المتطلبات
- Node.js v18 أو أحدث
- npm

### الخطوات

```bash
# 1. استنساخ المستودع
git clone https://github.com/mibo01699/Arabian-Eagle-AEC-Gateway.git
cd Arabian-Eagle-AEC-Gateway

# 2. تثبيت الاعتماديات
npm ci

# 3. نسخ ملف متغيرات البيئة
cp .env.example .env

# 4. تشغيل الخادم (بيئة التطوير)
npm start

# 5. اختبار نقاط النهاية
curl http://localhost:3314/api/health
```

الاختبارات

```bash
# تشغيل جميع الاختبارات
npm test

# اختبارات الأمان
npm run test:security

# اختبارات التكامل
npm run test:integration

# جميع الاختبارات معاً
npm run test:all
```

---

📡 نقاط النهاية (APIs)

المسار الطريقة الوصف
/api/health GET صحة البوابة نفسها
/api/apps GET قائمة جميع الخدمات مع حالتها الفعلية
/api/apps/:id GET حالة خدمة محددة (مثل /api/apps/bigish)
/api/status GET اختصار للحالة الكلية

مثال على الاستجابة (/api/health)

```json
{
  "service": "arabian-eagle-aec-gateway",
  "status": "ONLINE",
  "environment": "testnet",
  "timestamp": "2026-09-08T...",
  "pi": {
    "status": "NOT_IMPLEMENTED"
  }
}
```

---

🔄 بيئة العمل

البيئة الغرض
development التطوير المحلي
testnet الاختبار على شبكة Pi Testnet
mainnet الإطلاق النهائي على شبكة Pi Mainnet

---

🛠️ متغيرات البيئة

المتغير الوصف مثال
NODE_ENV بيئة التشغيل testnet
BIGISH_YER_URL رابط خدمة BIGISH-YER (مع /api) https://bigish-yer.vercel.app/api
CORS_ORIGIN النطاقات المسموح لها بالاتصال * أو https://gateway.vercel.app
HEALTH_TIMEOUT مهلة فحص الصحة (مللي ثانية) 3000
PORT منفذ التشغيل المحلي 3314

---

🧪 حالة CI

الاختبار الحالة
npm ci ✅ PASS
npm test ✅ PASS
npm run test:security ✅ PASS
npm run test:integration ✅ PASS
git diff --check ✅ PASS

CI أخضر — يعكس نجاحاً حقيقياً للاختبارات.

---

🚧 العوائق المتبقية

العائق الوصف
نشر BIGISH-YER لم يُنشر بعد — سيُنشر في مرحلة منفصلة
تكوين BIGISH_YER_URL سيُضبط بعد نشر BIGISH-YER
تكامل Pi Authentication NOT_IMPLEMENTED — سيُنفذ في المرحلة القادمة
نشر الخدمات الثمانية الأخرى جميعها NOT_DEPLOYED — سيتم نشرها تباعاً

---

📎 روابط

· المستودع: https://github.com/mibo01699/Arabian-Eagle-AEC-Gateway
· بوابة مطوري Pi: https://develop.pinet.com
· توثيق Pi SDK: https://docs.minepi.com

---

📜 الترخيص

هذا المشروع هو جزء من منظومة Arabian Eagle ويخضع لشروط الاستخدام الخاصة بالمؤسسة.

---

آخر تحديث: 8 سبتمبر 2026
الإصدار: v1.0-stabilization
