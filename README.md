# Dólar Blue Voice Microservice

Microservice built with Node.js that scrapes the current unofficial dollar exchange rate from dolarhoy.com and generates Twilio-compatible XML voice responses.

---

## ⚠️ Disclaimer

> This is a demonstration version for personal portfolio use only.  
> It is **not** the production version.  
> No sensitive or private data is included.

---

## 🚀 Features

- Scrapes real-time Dólar Blue values from a public website
- Parses and formats data into voice-friendly XML
- Generates fallback XML on error
- Responds to HTTP POST `/update` and GET `/dolar-blue` endpoints

---

## 🛠 Tech Stack

- Node.js
- Express.js
- Axios
- Cheerio
- dotenv
- xmlbuilder

---

## 📦 Setup

```bash
npm install
node dolar-blue-service.js
```

---

## 🧪 Environment Variables

Create a `.env` file using the following template:

```
TWILIO_WEBHOOK_URL=https://your-webhook-url.ngrok.io
```

---

## 🔐 License

This project is shared solely for personal portfolio purposes.  
**Reuse, redistribution or deployment is not permitted without explicit permission.**
