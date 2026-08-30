const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// إتاحة الملفات الساكنة (Frontend)
app.use(express.static(path.join(__dirname)));

// مسار رئيسي لتشغيل البوابة
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`Gateway is running on port ${PORT}`);
});
