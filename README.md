# 🌍 Geobites Monorepo — Windows Setup & Execution Guide

Geobites is a full-stack monorepo application featuring:
- **Backend (`/backend`)**: NestJS API + Better Auth + TypeORM + PostgreSQL.
- **Frontend (`/frontend`)**: React + Vite + TypeScript web app with Tailwind CSS (v4) and shadcn/ui.
- **Native App (`/native`)**: Expo / React Native + TypeScript mobile application.
- **Documentation (`/documentation`)**: Extended architecture, database design, and API specification files.

---

## 🛠️ Prerequisites for Windows

Before setting up the project, make sure you have the following installed on your Windows machine:

| Software | Recommended Version | Windows Installation Method |
| :--- | :--- | :--- |
| **Node.js** | `v18+` (LTS recommended) | [Download Installer](https://nodejs.org/) OR run in PowerShell: <br>`winget install OpenJS.NodeJS.LTS` |
| **Git** | Latest | [Download Git for Windows](https://git-scm.com/) OR run in PowerShell: <br>`winget install Git.Git` |
| **PostgreSQL** | `v15+` | [Download PostgreSQL Installer](https://www.postgresql.org/download/windows/) |
| **Expo Go (Optional)** | Latest | Install the **Expo Go** app from the Google Play Store or Apple App Store on your physical device to test the mobile app. |

---

## 🚀 Step-by-Step Setup on Windows

Follow these steps in **PowerShell** or **Windows Terminal** to get the application up and running.

### Step 1: Clone the Repository
```powershell
git clone <repository-url>
cd geobites
```

---

### Step 2: Database Setup (PostgreSQL)

You have two options for the database:
1. **Option A (Recommended): Local PostgreSQL.** Install PostgreSQL on Windows. During installation, set a password for the default `postgres` user (e.g., `postgres`, `123`, or custom).
2. **Option B (Zero Install): In-Memory Database.** Skip this database setup entirely and set `USE_MEMORY_DB=true` in `backend/.env` (see backend configuration below).

To set up Option A (Local PostgreSQL):
1. Open **pgAdmin 4** (installed with PostgreSQL) or open **SQL Shell (psql)** from the Windows Start menu.
2. In the PostgreSQL command prompt or query tool, execute the following to create the database:
   ```sql
   CREATE DATABASE geobites;
   ```
   *(Note: The backend is configured to connect to `geobites` using your PostgreSQL credentials).*

---

### Step 3: Backend Setup (NestJS & Better Auth)

1. Open a new PowerShell terminal and navigate to the backend directory:
   ```powershell
   cd backend
   ```
2. Copy the environment file template:
   * **PowerShell**:
     ```powershell
     Copy-Item .env.example .env
     ```
   * **Command Prompt**:
     ```cmd
     copy .env.example .env
     ```
3. Open `backend/.env` and update the database configuration to match your PostgreSQL installation credentials:
   ```env
   DB_PASSWORD=your_postgres_password_here
   
   # Or enable memory DB if you didn't install PostgreSQL:
   USE_MEMORY_DB=true
   ```
4. Install dependencies and start the backend development server:
   ```powershell
   npm install
   npm run start:dev
   ```
   The NestJS backend will start and list its endpoints. It runs at `http://localhost:3000` with API prefix `/api`.

---

### Step 4: Frontend Setup (React & Vite)

1. Open a second PowerShell terminal and navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
2. Copy the environment file template:
   * **PowerShell**:
     ```powershell
     Copy-Item .env.example .env
     ```
   * **Command Prompt**:
     ```cmd
     copy .env.example .env
     ```
3. Install dependencies and start the Vite development server:
   ```powershell
   npm install
   npm run dev
   ```
   The React frontend will start and be available at `http://localhost:5173`.

---

### Step 5: Mobile App Setup (Expo & React Native)

To test on your physical phone (Expo Go) or an emulator:

1. Open a third PowerShell terminal and navigate to the native directory:
   ```powershell
   cd native
   ```
2. Copy the environment file template:
   * **PowerShell**:
     ```powershell
     Copy-Item .env.example .env
     ```
   * **Command Prompt**:
     ```cmd
     copy .env.example .env
     ```
3. Find your Windows machine's local IP address so your phone can reach the backend:
   * Run `ipconfig` in PowerShell.
   * Look for the **IPv4 Address** under your active network adapter (e.g., `192.168.1.100`).
4. Update `native/.env` to point `EXPO_PUBLIC_API_URL` to your local IP address:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api
   ```
   > [!NOTE]
   > Make sure your Windows machine and physical phone are connected to the **same Wi-Fi network**.
5. Install dependencies and start the Expo dev server:
   ```powershell
   npm install
   npx expo start
   ```
6. Scan the QR code displayed in the terminal with your phone's camera (iOS) or the Expo Go app (Android).

---

## ⚡ Windows Troubleshooting & Network Tips

### 🧱 Windows Defender Firewall blocking Mobile Connections
If Expo Go fails to connect to your backend:
1. Ensure your network profile on Windows is set to **Private** rather than Public.
2. If issues persist, allow Node.js through the firewall:
   - Search for **"Allow an app through Windows Firewall"** in the Windows Start menu.
   - Click **Change Settings**.
   - Find `Node.js JavaScript Runtime` in the list and ensure both **Private** and **Public** checkboxes are ticked.

### 💾 Node/NPM Script errors on Windows
If you run into script execution policy errors (e.g., `nodemon : File C:\...\nodemon.ps1 cannot be loaded because running scripts is disabled on this system`):
- Run PowerShell as Administrator and run the following command to allow execution of local scripts:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
  ```

### 🗄️ PostgreSQL Connection Denied
If the backend throws `ECONNREFUSED 127.0.0.1:5432`:
1. Verify the PostgreSQL service is running. Open **Services** (search `services.msc` in Start menu), find `postgresql-x64-15` (or your version), and ensure its status is **Running**.
2. If it is stopped, right-click and choose **Start**.

---

## 📂 Monorepo Structure

```
geobites/
├── backend/          # NestJS Server (Port 3000)
├── frontend/         # React + Vite Client (Port 5173)
├── native/           # React Native + Expo App
└── documentation/    # Comprehensive Architecture & Design Docs
```

For detailed specifications on each layer, refer to the documents in the [documentation](file:///c:/Users/Cay/Documents/dev/geobites/documentation/) folder.
