# Auto Reply Bot 🤖

Bot auto reply untuk WhatsApp, Instagram, dan Messenger menggunakan AI Gemini.

## Stack
- Node.js + Express (server)
- Gemini API (AI)
- Meta Webhooks (WA + IG + Messenger)
- Railway (hosting)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Isi environment variables
```bash
cp .env.example .env
# Edit .env dan isi semua nilai
```

### 3. Jalankan lokal
```bash
npm start
```

### 4. Deploy ke Railway
- Push ke GitHub
- Connect repo di Railway
- Isi environment variables di Railway dashboard

## Environment Variables

| Variable | Keterangan |
|---|---|
| GEMINI_API_KEY | API key dari aistudio.google.com |
| VERIFY_TOKEN | Token bebas buatan sendiri |
| PAGE_ACCESS_TOKEN | Token dari Meta Developer |
| WA_PHONE_NUMBER_ID | Phone Number ID dari Meta WA |

## Webhook URL
Setelah deploy: `https://your-app.railway.app/webhook`
