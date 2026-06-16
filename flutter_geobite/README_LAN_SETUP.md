# 📱 Running Flutter App on Physical Device (Same Wi-Fi)

> Do this every time your **IP changes** (e.g., new network, router restart).

---

## ✅ Checklist

### 1. Find your PC's IP address
Open PowerShell and run:
```powershell
ipconfig
```
Look for **Wi-Fi → IPv4 Address** → e.g., `192.168.1.45`

---

### 2. Update `.env`
Open `flutter_geobite/.env` and set **`API_URL`** to your IP:

```env
API_URL=http://YOUR_IP_HERE:3000/api
```

**Example:**
```env
API_URL=http://192.168.1.45:3000/api
API_URL_WEB=http://localhost:3000/api
LAN_URL=http://192.168.1.45:3000/api
```

> ⚠️ Keep `API_URL_WEB` as `localhost` — that's for the browser only.

---

### 3. Allow port 3000 through Windows Firewall
Run **once** (only needed if phone can't connect):
```powershell
netsh advfirewall firewall add rule name="Geobites Backend" dir=in action=allow protocol=TCP localport=3000
```

---

### 4. Make sure your backend is running
```powershell
# From the project root
npm run dev:full
```
Backend should be live at `http://localhost:3000/api`

---

### 5. Rebuild & install the APK
```powershell
# From flutter_geobite/
flutter build apk --release
```
Then install:
```
build\app\outputs\flutter-apk\app-release.apk
```

---

## 🔁 Quick Change (IP changed?)

Only redo **steps 1 → 2 → 5**. Firewall rule persists.

---

## 🛠 Troubleshooting

| Problem | Fix |
|---|---|
| App shows "connection refused" | Check IP in `.env` is correct |
| Phone can't ping PC | Make sure both are on the **same Wi-Fi** |
| Still can't connect | Re-run the firewall command in Step 3 |
| Build uses old IP | Always rebuild APK after changing `.env` |
