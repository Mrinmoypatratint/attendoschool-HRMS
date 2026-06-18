# Local Development & Setup Guide

Follow these steps to set up the HRMS SaaS platform locally.

---

## 🛠️ Prerequisites

Ensure you have the following installed:
* **Node.js** (v20 or higher recommended)
* **npm** (v10 or higher)
* **Firebase CLI** (install globally via `npm install -g firebase-tools`)
* **Java Development Kit (JDK)** (required to run Firebase Emulators locally)

---

## 💻 Installation

1. **Clone the Repository** and navigate to the root directory.
2. **Install Monorepo Dependencies:**
   Run the following command in the root folder to install packages for the monorepo, including `frontend`, `backend`, and `middleware`:
   ```bash
   npm install
   ```

---

## ⚙️ Environment Variables Config

Configure local environment variables before starting the application.

### Frontend (`frontend/.env`)
Ensure `frontend/.env` is set up with emulator targets:
```env
VITE_USE_EMULATOR=true
VITE_FIREBASE_API_KEY=mock-api-key
VITE_FIREBASE_AUTH_DOMAIN=demo-mock-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-mock-project
VITE_FIREBASE_STORAGE_BUCKET=demo-mock-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=mock-sender-id
VITE_FIREBASE_APP_ID=mock-app-id
```

### Backend (`backend/.env` & `backend/.env.local`)
Create a local secret/env configuration in `backend/` if sending emails or using custom functions integrations.

---

## 🔌 Running the Firebase Emulators

The project is fully configured to run offline using Firebase Local Emulators.

Start the emulators with the pre-populated database import:
```bash
npm run emulators
```
This loads local accounts, roles, sample candidates, departments, and employees from the restored `./.firebase-emulator-data` directory and starts the following local ports:
* **Emulator Suite UI:** `http://127.0.0.1:4000/`
* **Authentication Emulator:** Port `9099`
* **Firestore Emulator:** Port `8080`
* **Functions Emulator:** Port `5001`
* **Storage Emulator:** Port `9199`

> [!NOTE]
> The database states are persistently exported back to `./.firebase-emulator-data` when the emulators shut down, ensuring your development data carries over between sessions.

---

## 🖥️ Running the Frontend Client

Once emulators are ready, spin up the React (Vite) development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173/`.

---

## 🗃️ Seeding Demo Accounts & Sample Data

To restore the database to its default demo state, run the seed script:
```bash
npm run seed
```
This registers the following standard demo profiles (Password for all: `Demo@1234`):
* **Super Admin:** `superadmin@demo.io` (System settings visibility)
* **Org Admin:** `orgadmin@demo.io` (Full organization operations controls)
* **HR Manager:** `hr@demo.io` (Employee profiles, departments, and document uploads)
* **Recruiter:** `recruiter@demo.io` (Careers page postings & Kanban pipeline)
* **Employee:** `employee@demo.io` (Scoped personal dashboard & leave requests)

---

## 🧪 Running Unit Tests

Run Vitest unit/integration tests in the frontend workspace:
```bash
npm -w frontend run test
```
This executes tests checking department loop prevention algorithms, leave duration accrual counters, and RBAC privilege configuration tables.
