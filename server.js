/**
 * JIYYAD TOOLS - AM PREM GEN 3.0 (Secure Proxy)
 * Proxy ke am-premiumms.ai.studio
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const BASE_URL = 'https://am-premiumms.ai.studio';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.static(path.join(__dirname, 'public')));

async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const opts = {
    method,
    headers: {
      'User-Agent': UA,
      'Origin': BASE_URL,
      'Referer': `${BASE_URL}/`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  if (body && (method === 'POST' || method === 'PUT')) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// Stats
app.get('/api/stats', async (req, res) => {
  try {
    const { data } = await apiRequest('/api/stats', 'GET');
    return res.json({
      status: !!data.success,
      total: Number(data.total) || 0,
      today: Number(data.today) || 0
    });
  } catch (err) {
    return res.status(500).json({ status: false, message: err.message });
  }
});

// Send magic link
app.post('/api/send', async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ status: false, message: 'Email valid diperlukan' });
    }

    const { status, data } = await apiRequest('/api/send-link', 'POST', { email });

    if (data.success) {
      return res.json({
        status: true,
        email,
        message: data.message || 'Link verifikasi berhasil dikirim ke email'
      });
    }

    return res.status(status >= 400 ? status : 400).json({
      status: false,
      message: data.message || data.error || 'Gagal mengirim magic link'
    });
  } catch (err) {
    console.error('[Send]', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
});

// Verify / activate
app.post('/api/verify', async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const magicLink = (req.body?.magicLink || req.body?.link || '').trim();

    if (!email || !email.includes('@')) {
      return res.status(400).json({ status: false, message: 'Email valid diperlukan' });
    }
    if (!magicLink) {
      return res.status(400).json({ status: false, message: 'Magic link diperlukan' });
    }

    const { status, data } = await apiRequest('/api/verify-link', 'POST', {
      email,
      magicLink
    });

    if (data.success) {
      const info = data.data || data.userData || {};
      return res.json({
        status: true,
        email,
        uid: info.uid || '',
        orderId: info.orderId || '',
        validUntil: info.validUntil || '1 Tahun',
        message: data.message || 'Akun Alight Motion berhasil diverifikasi dan Premium aktif!',
        userData: info
      });
    }

    return res.status(status >= 400 ? status : 400).json({
      status: false,
      message: data.message || data.error || 'Verifikasi magic link gagal'
    });
  } catch (err) {
    console.error('[Verify]', err.message);
    return res.status(500).json({ status: false, message: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  ⚡ JIYYAD TOOLS — AM PREM GEN 3.0`);
  console.log(`  ➜  Local:   http://localhost:${PORT}\n`);
});
