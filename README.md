# 🌍 Geobites Monorepo — Windows Setup & Execution Guide

Geobites is a full-stack monorepo application featuring:
- **Backend (`/backend`)**: NestJS API + Better Auth + TypeORM + PostgreSQL.
- **Frontend (`/frontend`)**: React + Vite + TypeScript web app with Tailwind CSS (v4) and shadcn/ui.
- **Native App (`/native`)**: Expo / React Native + TypeScript mobile application.
- **Documentation (`/documentation`)**: Extended architecture, database design, and API specification files.

---

## ⚡ Quick Start (Zero PostgreSQL Setup — 2 Minutes)

If you want to quickly test the application or run it without installing PostgreSQL, you can run the backend with a local persistent **SQLite** database or an **In-Memory** database:

### 1. Copy the Environment Templates
Run these commands in the root directory to create the configuration files:
*   **PowerShell**:
    ```powershell
    Copy-Item backend/.env.example backend/.env
    Copy-Item frontend/.env.example frontend/.env
    ```
*   **Command Prompt (cmd)**:
    ```cmd
    copy backend\.env.example backend\.env
    copy frontend\.env.example frontend\.env
    ```

### 2. Configure Database Option (Choose One)
Open the newly created `backend/.env` file and set the desired database:
*   **Option A: Persistent SQLite (Recommended for Zero Setup)**:
    Set `DB_TYPE` to `sqlite` (saves to a local `geobites.db` file):
    ```env
    DB_TYPE=sqlite
    ```
*   **Option B: Ephemeral In-Memory**:
    Set `USE_MEMORY_DB` to `true` (runs purely in-memory, data is lost when server stops):
    ```env
    USE_MEMORY_DB=true
    ```

### 3. Start Frontend & Backend Concurrently
From the root directory, run:
```powershell
npm install
npm run dev:full
```
This single command installs all dependencies and starts both the NestJS backend and Vite frontend concurrently.
*   **Backend Server**: running on `http://localhost:3000`
*   **Frontend Client**: running on `http://localhost:5173` (or the port Vite outputs)

The database will auto-initialize the tables and automatically seed demo food vendors, menus, and promotions. No PostgreSQL install required!

---

## 🛠️ Prerequisites for Windows

Before setting up the project, make sure you have the following installed on your Windows machine (PostgreSQL is optional if using the Quick Start above):

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

### Step 2: Database Setup

You have three options for the database setup:

1. **Option A (Persistent & Production-ready): Local PostgreSQL**
   * Install PostgreSQL on Windows (v15+ recommended). During installation, set a password for the default `postgres` user.
   * Open **pgAdmin 4** (installed with PostgreSQL) or open **SQL Shell (psql)** from the Windows Start menu.
   * Execute the following to create the database:
     ```sql
     CREATE DATABASE geobites;
     ```
   * Set `DB_TYPE=postgres` (default) and provide your connection credentials (`DB_PASSWORD`) in `backend/.env`.

2. **Option B (Zero Install & Persistent): Local SQLite**
   * Skip PostgreSQL installation entirely.
   * Open `backend/.env` and set:
     ```env
     DB_TYPE=sqlite
     ```
   * The database will save automatically to a local file (`backend/geobites.db`).

3. **Option C (Zero Install & Ephemeral): In-Memory Database**
   * Runs the database entirely in memory. Useful for quick one-off testing.
   * Open `backend/.env` and set:
     ```env
     USE_MEMORY_DB=true
     ```
   * Note that all data is reset/wiped every time the backend server restarts.

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
3. Open `backend/.env` and update the database configuration:
    ```env
    DB_PASSWORD=your_postgres_password_here
    
    # Or use SQLite (persistent, zero-setup):
    DB_TYPE=sqlite
    
    # Or use In-Memory (ephemeral, reset on restart):
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
