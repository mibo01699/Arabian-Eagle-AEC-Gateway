# 🦅 Arabian Eagle AEC Gateway

البوابة السيادية الموحدة لمنظومة النسر العربي للتطبيقات اللامركزية (AEC Gateway).

---

## 📖 نبذة عن المشروع

**Arabian Eagle AEC Gateway** هي البوابة الأم التي تربط وتدير وتسوي بين **تسعة تطبيقات سيادية** تعمل ضمن منظومة النسر العربي للتقنية (A.E.C). توفر البوابة واجهة موحدة (Dashboard) لعرض حالة جميع التطبيقات، وإجراء عمليات المصادقة، وتنفيذ المعاملات المالية عبر شبكة Pi Network، بالإضافة إلى توفير طبقة مقاصة مركزية آمنة.

### 🧭 الخريطة البيئية للتطبيقات التسعة مع روابط النشر

| # | التطبيق | الاسم الرمزي | رابط النشر (API) | الطبقة/الوظيفة |
|---|---|---|---|---|
| 1 | **BIGISH-YER** | `bigish-yer` | [https://bigish-yer.vercel.app](https://bigish-yer.vercel.app) | الطبقة المالية الأساسية (التسوية والعملة) |
| 2 | **A.E.C Sovereign Fund** | `aec-fund` | [https://arab-eagle-sovereign-fund-a-e-c.vercel.app](https://arab-eagle-sovereign-fund-a-e-c.vercel.app) | صندوق النسر العربي السيادي (الاحتياطي والقروض) |
| 3 | **Be-well** | `be-well` | [https://be-well-rho.vercel.app](https://be-well-rho.vercel.app) | منصة التأمين الصحي والرعاية |
| 4 | **AJYAL** | `ajyal` | [https://ajyal-framework.vercel.app](https://ajyal-framework.vercel.app) | بروتوكول التعليم والإغاثة والرواتب |
| 5 | **GAV** | `gav` | [https://gav-the-incense-route.vercel.app](https://gav-the-incense-route.vercel.app) | طريق البخور – التجارة والخدمات اللوجستية ونقاط البيع |
| 6 | **Suppliers-Auction** | `auction` | [https://suppliers-auction.vercel.app](https://suppliers-auction.vercel.app) | مزاد الموردين والمشتريات الحكومية |
| 7 | **COBRA** | `cobra` | [https://cobra-protocol.vercel.app](https://cobra-protocol.vercel.app) | اتصالات الطوارئ والشبكات المرنة (eSIM، Mesh، Satellite) |
| 8 | **AMAN** | `aman` | [https://aman-protocol.vercel.app](https://aman-protocol.vercel.app) | بروتوكول التأمين اللامركزي الذكي (DeFi/DeIn) |
| 9 | **Telcom-Mobile-Protocol** | `telcom` | [https://telcom-mobile-protocol.vercel.app](https://telcom-mobile-protocol.vercel.app) | بروتوكول الاتصالات الرقمية والخدمات الخلوية |

---

## ✨ الميزات الرئيسية

* **لوحة تحكم موحدة (Dashboard)** تعرض جميع التطبيقات التسعة مع حالة الاتصال الفعلية لكل منها (ONLINE / DEGRADED / OFFLINE / NOT_DEPLOYED).
* **دعم كامل للغة العربية (RTL)** مع إمكانية التبديل إلى اللغة الإنجليزية.
* **تكامل آمن مع Pi Network** باستخدام Pi SDK الرسمي، مع فصل عمليات المصادقة عن الموافقة على الدفع.
* **طبقة مقاصة مركزية (Server-Side Clearing)** تعتمد على `BigInt` للحفاظ على الدقة المالية ومنع أخطاء الفاصلة العائمة.
* **آلية تحقق من عدم تكرار الدفع (Idempotency)** وحماية ضد هجمات إعادة التشغيل (Replay Attacks).
* **نظام فحص صحي حقيقي (Health Checks)** لكل تطبيق مع مهلة زمنية (Timeout) وحالات متعددة.
* **تصميم متجاوب (Android-first)** مع مراعاة معايير إمكانية الوصول (Accessibility).
* **سياسة أمان مشددة** تشمل CSP، منع `eval`، تنظيف المدخلات، وحماية من XSS و CSRF.
* **جاهز للنشر على Vercel** مع ملف `vercel.json` مهيأ مسبقاً.

---

## 🛠️ المتطلبات الأساسية

* Node.js (الإصدار 18.x أو أحدث)
* npm أو yarn
* حساب على Vercel للنشر (اختياري)

---

## 📦 التثبيت والتشغيل المحلي

1.  **استنساخ المستودع**
    ```bash
    git clone https://github.com/mibo01699/Arabian-Eagle-AEC-Gateway.git
    cd Arabian-Eagle-AEC-Gateway
    ```

2.  **تثبيت الاعتماديات**
    ```bash
    npm install
    ```

3.  **تهيئة متغيرات البيئة**
    أنشئ ملف `.env` في الجذر وأضف المتغيرات التالية (استبدل `your-...-url.com` بالروابط الحقيقية):
    ```env
    BIGISH_YER_API=https://bigish-yer.vercel.app
    FUND_API=https://arab-eagle-sovereign-fund-a-e-c.vercel.app
    BE_WELL_API=https://be-well-rho.vercel.app
    AJYAL_API=https://ajyal-framework.vercel.app
    GAV_POS_API=https://gav-the-incense-route.vercel.app
    AUCTION_API=https://suppliers-auction.vercel.app
    COBRA_API=https://cobra-protocol.vercel.app
    AMAN_API=https://aman-protocol.vercel.app
    TELCOM_API=https://telcom-mobile-protocol.vercel.app
    ALLOWED_ORIGINS=https://arabian-eagle-aec-gateway.vercel.app,http://localhost:3000
    ```

4.  **تشغيل الخادم محلياً**
    ```bash
    node server.js
    ```
    ستكون البوابة متاحة على `http://localhost:3000`.

5.  **فتح الواجهة**
    افتح المتصفح على `http://localhost:3000` لعرض لوحة التحكم.

---

## 🚀 النشر على Vercel

المشروع مهيأ للنشر الفوري على منصة Vercel عبر ملف `vercel.json`.

**خطوات النشر:**
1.  تأكد من رفع الكود إلى مستودع GitHub.
2.  قم بربط المستودع بـ Vercel من خلال لوحة التحكم.
3.  أضف متغيرات البيئة (كما في الخطوة 3 أعلاه) داخل إعدادات Vercel.
4.  انقر على "Deploy" وستحصل على رابط مباشر للبوابة.

---

## 🔌 واجهات برمجة التطبيقات (API Endpoints)

توفر البوابة نقاط النهاية التالية للتكامل مع التطبيقات الأخرى:

| المسار | الطريقة | الوصف |
|---|---|---|
| `/api/health` | GET | التحقق من صحة البوابة نفسها |
| `/api/apps` | GET | جلب قائمة جميع التطبيقات مع بياناتها وحالتها |
| `/api/apps/:id` | GET | جلب تفاصيل تطبيق معين (حسب المعرف) |
| `/api/status` | GET | الحالة العامة للمنظومة |
| `/api/auth/pi` | POST | مصادقة المستخدم عبر Pi Network (تُرسل `accessToken` من العميل) |

**مثال على استجابة `/api/apps`:**
```json
[
  {
    "id": "bigish-yer",
    "name": "BIGISH-YER",
    "description": "طبقة التسوية المالية الأساسية",
    "url": "https://bigish-yer.vercel.app",
    "status": "ONLINE",
    "version": "1.0.0",
    "healthEndpoint": "https://bigish-yer.vercel.app/api/health",
    "category": "financial"
  }
  // ... باقي التطبيقات
]
```

---

🧪 الاختبارات

لتشغيل الاختبارات (إذا تم إضافتها مستقبلاً):

```bash
npm test
```

---

🤝 المساهمة

نرحب بمساهماتكم! يرجى اتباع الخطوات التالية:

1. عمل Fork للمشروع.
2. إنشاء فرع جديد (git checkout -b feature/amazing-feature).
3. إجراء التغييرات المطلوبة.
4. رفع التغييرات (git push origin feature/amazing-feature).
5. فتح Pull Request.

ملاحظات هامة للمساهمين:

· الالتزام بمعايير الأمان المذكورة في الوثائق.
· استخدام BigInt في أي عمليات مالية، وتجنب Number أو parseFloat.
· عدم تخزين أي مفاتيح خاصة أو أسرار في الكود المصدري.
· التأكد من اجتياز جميع الاختبارات قبل رفع الطلب.

---

📜 الترخيص

هذا المشروع مرخص تحت رخصة MIT – راجع ملف LICENSE للتفاصيل.

---

📞 التواصل والدعم

· البوابة الرسمية: https://arabian-eagle-aec-gateway.vercel.app
· المستودع: GitHub - mibo01699/Arabian-Eagle-AEC-Gateway
· فريق التطوير: شركة النسر العربي للتقنية (Arabian Eagle Tech)

---

⚠️ إخلاء المسؤولية

هذا المشروع هو بوابة تكامل سيادية. جميع عمليات الدفع والمصادقة تخضع للتحقق من جانب الخادم (Server-Side Validation). لا يتم تخزين أي مفاتيح خاصة أو عبارات استرداد للمحفظة في الواجهة الأمامية. التطبيق ليس معتمداً رسمياً من Pi Network أو UNICEF إلا في حال وجود وثائق رسمية تثبت ذلك.

---

🦅 نحو مستقبل لامركزي آمن وموحد.
