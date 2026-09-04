// ===== مصادقة Pi Network (معدلة) =====
async function authenticateWithPi() {
  try {
    if (typeof Pi === 'undefined') {
      showToast(i18n.t('pi.errors.sdkNotLoaded'), 'error');
      return;
    }

    // تهيئة Pi SDK (مرة واحدة فقط)
    if (!Pi.isInitialized) {
      Pi.init({
        version: "2.0",
        sandbox: true
      });
    }

    // طلب المصادقة من Pi SDK
    const authResult = await Pi.authenticate(['username', 'wallet_address'], (error) => {
      if (error) {
        console.error('Pi authentication error:', error);
        showToast(i18n.t('pi.errors.authFailed'), 'error');
      }
    });

    if (authResult && authResult.accessToken) {
      // إرسال التوكن فقط إلى الخادم للتحقق
      const response = await fetch('/api/auth/pi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: authResult.accessToken
        })
      });

      const result = await response.json();

      if (result.success) {
        // تخزين بيانات المستخدم الموثقة من الخادم
        piUser = result.user;
        isAuthenticated = true;
        updateUI();
        showToast(i18n.t('toast.pi.authSuccess'), 'info');
      } else {
        // عرض رسالة الخطأ من الخادم
        showToast(result.error || i18n.t('pi.errors.authFailed'), 'error');
      }
    }
  } catch (error) {
    console.error('Authentication error:', error);
    showToast(i18n.t('pi.errors.authFailed'), 'error');
  }
}