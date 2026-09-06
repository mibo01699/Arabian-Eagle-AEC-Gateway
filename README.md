# Arabian Eagle AEC Gateway

هذه البوابة هي نقطة الدخول الموحدة لتطبيقات Arabian Eagle ecosystem.  
توفر البوابة واجهة برمجة تطبيقات (API) لمراقبة حالة التطبيقات المختلفة من خلال نقاط صحية (`/api/health`) لكل تطبيق.

## الحالة الحالية (بناءً على الكود الفعلي)

- **التطبيقات الأربعة (BIGISH-YER, GAV, AJYAL, Suppliers-Auction)**:  
  - تم نشرها على Vercel وتستجيب نقطة `/api/health` (تظهر ONLINE).  
  - **ملاحظة**: ONLINE تعني فقط أن نقطة الصحة تعمل، ولا تعني أن التطبيق جاهز للإنتاج أو مكتمل وظيفياً.  
  - لا تزال هذه التطبيقات في مرحلة تطوير (Development / Prototype).

- **التطبيقات الخمسة الأخرى (Sovereign Fund, Be-well, COBRA, AMAN, Telcom)**:  
  - غير منشورة حالياً، ولا يوجد لها روابط إنتاج، فتظهر بحالة `NOT_DEPLOYED`.

## نقاط النهاية (Endpoints)

| المسار | الطريقة | الوصف |
|--------|---------|-------|
| `/api/health` | GET | صحة البوابة نفسها |
| `/api/apps` | GET | قائمة جميع التطبيقات مع حالتها |
| `/api/apps/:id` | GET | حالة تطبيق معين (استخدم المعرفات: `bigish-yer`, `gav`, `ajyal`, `suppliers-auction`, `sovereign-fund`, `be-well`, `cobra`, `aman`, `telcom`) |
| `/api/status` | GET | ملخص الحالة العامة لجميع التطبيقات |

## نظام تحديد الحالة (بدون أي قائمة ثابتة)

تعتمد البوابة على فحص صحي فعلي لكل تطبيق عبر استدعاء `https://<app-url>/api/health`. الحالات الممكنة:

- **ONLINE**: رابط صالح، واستجابة HTTP 200 مع JSON صحيح من `/api/health`.
- **DEGRADED**: رابط صالح، لكن الاستجابة غير ناجحة (مثل 404، 500) أو محتوى غير JSON.
- **OFFLINE**: رابط صالح، لكن فشل الاتصال (انتهاء المهلة أو رفض الشبكة).
- **NOT_DEPLOYED**: لا يوجد رابط محدد في متغيرات البيئة.
- **UNKNOWN**: الرابط موجود ولكن غير صالح (بروتوكول غير مدعوم أو تنسيق خاطئ).

**لا يوجد أي تجاوز أو قائمة ثابتة تفرض حالة `ONLINE` على أي تطبيق.**

## متغيرات البيئة المطلوبة

ضع في ملف `.env` الروابط الفعلية للتطبيقات المنشورة، مثلاً:

```env
BIGISH_YER_URL=https://bigish-yer.vercel.app
GAV_URL=https://gav-the-incense-route.vercel.app
AJYAL_URL=https://ajyal-framework.vercel.app
SUPPLIERS_AUCTION_URL=https://suppliers-auction.vercel.app
# باقي التطبيقات غير منشورة حالياً، فلا حاجة لتعريفها، وستظهر NOT_DEPLOYED