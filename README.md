<div align="center">

# 🚀 Sole-what: Next-Gen WhatsApp & AI Automation Gateway

[![WhatsApp Gateway](https://img.shields.io/badge/WhatsApp-Gateway-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://wa.me/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Repository](https://img.shields.io/badge/GitHub-Sole--what-blue?style=for-the-badge&logo=github)](https://github.com/bhaijew/sole_what)

**A professional multi-session WhatsApp Gateway, Interactive Messaging, Drip Marketing, and AI Auto-Responder System.**  
Built with **Next.js**, **React**, **Prisma**, and **Baileys** for high-performance messaging automation and real-time WhatsApp Bot services.

[Features](#-key-features) • [User Guide](docs/USER_GUIDE.md) • [API Documentation](docs/API_DOCUMENTATION.md) • [Database Setup](docs/DATABASE_SETUP.md) • [Installation](#-quick-installation)

</div>

---

## 📖 Complete Documentation

**Sole-what** comes with extensive documentation designed for both developers and users.

- **[Master Project Documentation](docs/PROJECT_DOCUMENTATION.md)**: Architecture, database schema, and logic flow.
- **[API Documentation](docs/API_DOCUMENTATION.md)**: Comprehensive reference for all **100+ endpoints**.
- **[API Quick Reference](docs/API-QUICK-REFERENCE.md)**: Instantly jumpstart your integration with ready-to-use cURL and JavaScript snippets.
- **[Environment Variables](docs/ENVIRONMENT_VARIABLES.md)**: Configuration and security guide.

---

## 🌟 Why Sole-what?

**Sole-what** transforms WhatsApp into a fully programmable RESTful API and automated customer engagement platform. It bridges business logic with WhatsApp's global reach, supporting AI auto-replies, interactive messages, multi-step drip campaigns, and real-time webhook routing.

### 🏗️ How it Works

```mermaid
graph LR
    User([User / App / Webhook]) -->|REST API| API[Sole-what Gateway]
    API -->|Baileys| WhatsApp[[WhatsApp Network]]
    API -->|Gemini / OpenAI| AI[AI Auto-Responder]
    API -->|Real-time| DB[(Prisma / DB)]
    WhatsApp -.->|Webhook| API
    API -.->|Event Forwarding| Webhook([External CRM / n8n])
```

---

## 🔥 Key Features

### 🤖 1. AI Auto-Responder & Smart Fallback Mode
- Powered by **Google Gemini** & **OpenAI**.
- **Fallback Mode Switch**: When enabled, the AI bot *only* answers when no keyword rule matches.
- Custom System Prompts, temperature tuning, and real-time response simulator.

### 💧 2. Drip Marketing Campaigns
- Multi-step automated customer follow-up sequences with custom delay intervals (minutes/hours).
- **Auto-Stop Protection**: Automatically unsubscribes contacts from sequence when they reply.

### 💬 3. Interactive WhatsApp Messages
- Send **Polls** (multi-option questions with vote tracking).
- Send **Location Pins** (latitude/longitude with Google Maps link preview).
- Send **vCard Contact Cards** directly into chat.
- Send **Stickers** & Media attachments (Images, Videos, Audio, Documents).

### 🎯 4. Upgraded Keyword Auto-Reply Engine
- Exact match, contains match, and regex trigger rules.
- Supports Text, Image, Poll, Location, and Contact response types.
- Configurable response delay seconds and on/off toggle.
- Built-in **Live Rule Simulator** for real-time rule testing.

### 🛍️ 5. E-Commerce Quick Templates
- One-click templates for Order Confirmations, Shipping Updates, Abandoned Cart Reminders, Customer Reviews, and Support requests.

### 📱 6. Multi-Session Gateway
- Connect and manage unlimited WhatsApp accounts simultaneously via simple QR code scans.

### 📢 7. Safe Broadcast System
- Bulk messaging with anti-ban mechanisms, batching, and customizable delay intervals.

### 🔗 8. Enterprise Webhook Management
- Real-time webhook delivery for `message.received`, `message.sent`, `connection.update`, and `group.update` events.

### 📘 9. Interactive Swagger UI & OpenAPI Specs
- Built-in interactive API reference hosted at `/swagger` and `/dashboard/api-docs`.

---

## 🚀 Quick Installation

### 1. Prerequisites
- Node.js 20+ (Node.js 22 recommended)
- MySQL Database
- Git
- PM2 (Installed globally: `npm install -g pm2`)

### 2. Setup
```bash
# Clone and install
git clone https://github.com/bhaijew/sole_what.git
cd sole-what
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, AUTH_SECRET, PORT, etc.

# Push schema and generate Prisma Client
npx prisma db push
npx prisma generate

# Create SuperAdmin account
npm run make-admin admin@example.com password123
```

### 3. Run (Development)
```bash
npm run dev
```

### 4. Run (Production with PM2)
```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

---

## 📚 API Reference Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/messages/{sessionId}/{jid}/send` | Send text, media, or stickers |
| `POST` | `/api/messages/{sessionId}/{jid}/poll` | Send interactive WhatsApp polls |
| `POST` | `/api/messages/{sessionId}/{jid}/location` | Send location pins |
| `POST` | `/api/messages/{sessionId}/{jid}/contact` | Send vCard contact cards |
| `POST` | `/api/messages/{sessionId}/broadcast` | Scalable bulk messaging |
| `GET` | `/api/sessions/{sessionId}/ai-config` | Fetch AI Auto-Responder configuration |
| `POST` | `/api/sessions/{sessionId}/ai-config` | Update AI bot & fallback mode settings |
| `POST` | `/api/sequences/{sessionId}` | Create multi-step drip marketing campaign |

---

## 👤 Author & Contributor

<div align="center">

Developed and Maintained by **[Zeeshan](https://github.com/zeeshan912989)**

</div>

---

<div align="center">
  Built with ❤️ for <b>Sole-what</b>
</div>
