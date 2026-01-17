# 🚀 Current Running Services

**Last Updated**: $(date)

---

## ✅ All Services Running

### 🔹 Backend Server
- **Local URL**: `http://localhost:5001`
- **Status**: ✅ Running
- **Process**: Node.js + Express + TypeScript

### 🔹 Frontend Server
- **Local URL**: `http://localhost:5173`
- **Status**: ✅ Running
- **Process**: Vite + React

### 🔹 ngrok Tunnel
- **Public URL**: `https://journee-mechanomorphic-soledad.ngrok-free.dev`
- **Local Port**: `5001`
- **Status**: ✅ Running
- **Dashboard**: `http://localhost:4040`

---

## 📋 Webhook URLs

### Facebook Webhook
```
https://journee-mechanomorphic-soledad.ngrok-free.dev/api/webhooks/facebook
```

### Chatwoot Webhook
```
https://journee-mechanomorphic-soledad.ngrok-free.dev/api/chatwoot/webhooks/chatwoot
```

---

## 🔐 SuperAdmin Login

- **URL**: `http://localhost:5173/login`
- **Email**: `superadmin@omni.com`
- **Password**: `superadmin123`

---

## 🌐 Quick Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001/api
- **ngrok Public**: https://journee-mechanomorphic-soledad.ngrok-free.dev
- **ngrok Dashboard**: http://localhost:4040

---

## ⚠️ Important Notes

1. **ngrok Free Version**: URL changes each time you restart ngrok
2. **Keep Running**: All services must stay running for webhooks to work
3. **Facebook Setup**: Use the ngrok webhook URL in Facebook App settings
4. **Chatwoot Setup**: Use the ngrok webhook URL in Chatwoot settings

---

## 🛠️ Commands to Restart

### Start Backend
```bash
cd server && npm run dev
```

### Start Frontend
```bash
cd client && npm run dev
```

### Start ngrok
```bash
ngrok http 5001
```

---

**Note**: This file is auto-generated. ngrok URL will change on restart.
