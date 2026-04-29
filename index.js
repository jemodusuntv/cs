const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// =====================
// KONFIGURASI - ISI INI
// =====================
const CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'ISI_API_KEY_GEMINI_KAMU',
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || 'xyz_autoreply_token_rahasia',
  PAGE_ACCESS_TOKEN: process.env.PAGE_ACCESS_TOKEN || 'ISI_PAGE_ACCESS_TOKEN_META',
  WA_PHONE_NUMBER_ID: process.env.WA_PHONE_NUMBER_ID || 'ISI_WA_PHONE_NUMBER_ID',
};

// =====================
// SYSTEM PROMPT AI
// =====================
const SYSTEM_PROMPT = `Kamu adalah asisten virtual dari kreator konten YouTube dan media sosial bernama xyz outdoor.

Tugasmu adalah membalas pesan masuk dengan ramah, santai, dan helpful.

Informasi penting:
- Channel YouTube: xyz outdoor (konten memancing, alam, outdoor)
- Juga mengelola: Country Calm Vibes, The Rain Vault, QuantumAIMindset
- Untuk kolaborasi: minta detail proyek dan budget terlebih dahulu
- Untuk lokasi mancing: arahkan ke video terbaru di channel xyz outdoor
- Untuk request konten: catat dan bilang akan dipertimbangkan

Aturan menjawab:
- Gunakan bahasa Indonesia santai dan friendly
- Panggil pengirim dengan "Kak"
- Jawab singkat, maksimal 3-4 kalimat
- Gunakan emoji secukupnya
- JANGAN berikan nomor HP, alamat, atau data pribadi
- Kalau tidak tahu, bilang akan dihubungi kembali
- Kalau ada pertanyaan kompleks soal bisnis/kolaborasi besar, bilang akan dibalas langsung oleh pemilik akun`;

// =====================
// FUNGSI GEMINI AI
// =====================
async function getAIReply(userMessage) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nPesan dari pengguna: ${userMessage}`
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7,
        }
      }
    );

    const reply = response.data.candidates[0].content.parts[0].text;
    return reply.trim();
  } catch (error) {
    console.error('Gemini error:', error.message);
    return 'Halo Kak! Makasih udah menghubungi. Saya akan balas secepatnya ya 🙏';
  }
}

// =====================
// FUNGSI KIRIM PESAN
// =====================

// Kirim ke Messenger / Instagram
async function sendMetaMessage(recipientId, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${CONFIG.PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: recipientId },
        message: { text: message }
      }
    );
    console.log(`✅ Pesan terkirim ke ${recipientId}`);
  } catch (error) {
    console.error('❌ Gagal kirim pesan Meta:', error.response?.data || error.message);
  }
}

// Kirim ke WhatsApp
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${CONFIG.WA_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${CONFIG.PAGE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`✅ WA terkirim ke ${phoneNumber}`);
  } catch (error) {
    console.error('❌ Gagal kirim WA:', error.response?.data || error.message);
  }
}

// =====================
// WEBHOOK VERIFICATION
// =====================
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
    console.log('✅ Webhook verified!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// =====================
// TERIMA PESAN MASUK
// =====================
app.post('/webhook', async (req, res) => {
  const body = req.body;
  res.sendStatus(200); // Selalu balas 200 dulu ke Meta

  try {
    // Cek apakah ini dari WhatsApp
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const messages = change.value?.messages;
          if (!messages) continue;

          for (const msg of messages) {
            if (msg.type === 'text') {
              const from = msg.from;
              const text = msg.text.body;
              console.log(`📱 WA dari ${from}: ${text}`);

              const reply = await getAIReply(text);
              await sendWhatsAppMessage(from, reply);
            }
          }
        }
      }
    }

    // Cek apakah ini dari Messenger atau Instagram
    if (body.object === 'page' || body.object === 'instagram') {
      for (const entry of body.entry) {
        const messaging = entry.messaging;
        if (!messaging) continue;

        for (const event of messaging) {
          if (event.message && !event.message.is_echo) {
            const senderId = event.sender.id;
            const text = event.message.text;

            if (!text) continue; // Skip kalau bukan teks

            const platform = body.object === 'instagram' ? 'Instagram' : 'Messenger';
            console.log(`💬 ${platform} dari ${senderId}: ${text}`);

            const reply = await getAIReply(text);
            await sendMetaMessage(senderId, reply);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error webhook:', error.message);
  }
});

// =====================
// ROOT ENDPOINT
// =====================
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    message: 'xyz outdoor Auto Reply Bot aktif! 🤖',
    platforms: ['WhatsApp', 'Instagram', 'Messenger']
  });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot berjalan di port ${PORT}`);
  console.log(`📡 Webhook URL: https://your-domain.railway.app/webhook`);
});
