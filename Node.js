const { Pi } = require('@pi-network/sdk'); // أو استخدام واجهة REST

app.post('/api/payment/complete', async (req, res) => {
  const { paymentId, txid, signature } = req.body;
  // 1. التحقق من idempotency
  const existing = await Payment.findByPaymentId(paymentId);
  if (existing) return res.status(400).json({ error: 'Duplicate payment' });

  // 2. التحقق من التوقيع مع Pi (أو أي بوابة دفع)
  const isValid = await verifyPiPayment(paymentId, txid, signature);
  if (!isValid) return res.status(403).json({ error: 'Invalid signature' });

  // 3. تنفيذ العملية (باستخدام BigInt)
  const amount = BigInt(req.body.amount); // بافتراض أن المبلغ يُرسل كسلسلة نصية
  // تحديث الرصيد ...

  // 4. تسجيل العملية
  await Payment.create({ paymentId, txid, amount, status: 'completed' });

  res.json({ success: true });
});