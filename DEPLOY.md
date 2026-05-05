# 🚀 Deploy to Firebase Hosting

## Quick Deploy (3 Steps)

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Build & Deploy
```bash
npm run deploy:hosting
```

**Live URL:** https://sabrang-26.web.app

---

## 📦 Manual Deploy

```bash
npm run build
firebase deploy --only hosting
```

---

## ⚠️ Important Notes

### Environment Variables
Set in Firebase Console → Project Settings → Your apps

### API Routes
Firebase Hosting doesn't support Next.js API routes. Use:
- Firebase Cloud Functions, OR
- Client-side logic

### Custom Domain
Firebase Console → Hosting → Add custom domain

---

## 🔄 Update Site

```bash
npm run deploy:hosting
```

---

## 🎯 Commands

| Command | Description |
|---------|-------------|
| `npm run deploy:hosting` | Build & deploy |
| `firebase deploy --only hosting` | Deploy only |
| `firebase open hosting:site` | Open live site |
| `firebase hosting:rollback` | Undo deployment |
