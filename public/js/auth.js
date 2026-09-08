// =============================================
// دوال المصادقة عبر Pi
// =============================================

// تسجيل الدخول
function loginWithPi() {
    const loginBtn = document.getElementById('login-btn');
    const errorDiv = document.getElementById('login-error');
    
    loginBtn.disabled = true;
    loginBtn.textContent = 'جاري الاتصال...';
    errorDiv.style.display = 'none';

    Pi.authenticate()
        .then(function(auth) {
            console.log("✅ تمت المصادقة بنجاح:", auth);
            // إرسال التوكن إلى الخادم للتحقق
            return fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: auth.accessToken })
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('فشل التحقق من التوكن');
            }
            return response.json();
        })
        .then(user => {
            console.log("✅ معلومات المستخدم:", user);
            // عرض واجهة المستخدم
            document.getElementById('user-name').textContent = user.username || 'مستخدم Pi';
            document.getElementById('user-id').textContent = user.id || 'غير معروف';
            document.getElementById('username').textContent = user.username || 'مستخدم Pi';
            document.getElementById('logout-btn').style.display = 'inline-block';
            // إظهار لوحة التحكم وإخفاء زر تسجيل الدخول
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('dashboard-section').style.display = 'block';
            // تحميل حالة الخدمات
            refreshServices();
        })
        .catch(function(error) {
            console.error("❌ خطأ:", error);
            errorDiv.textContent = 'حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.';
            errorDiv.style.display = 'block';
        })
        .finally(function() {
            loginBtn.disabled = false;
            loginBtn.textContent = '🚀 تسجيل الدخول بحساب Pi';
        });
}

// تسجيل الخروج
function logout() {
    // في Pi SDK لا توجد دالة تسجيل خروج رسمية، نكتفي بإعادة تحميل الصفحة
    location.reload();
}