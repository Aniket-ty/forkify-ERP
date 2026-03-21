# Forkify ERP — Expo React Native App

A complete mobile port of the Forkify ERP web application, built with Expo Router and React Native.

## 🚀 Quick Start

### 1. Install dependencies
```bash
cd ForkifyERP
npm install
```

### 2. Set your API URL
Create a `.env` file in the project root:
```
EXPO_PUBLIC_API_URL=http://YOUR_BACKEND_IP:8080/api
```
> ⚠️ Use your machine's LAN IP (e.g. `192.168.1.10`), not `localhost` — the phone won't resolve `localhost` to your dev machine.

### 3. Start the app
```bash
npx expo start
```
Scan the QR code with **Expo Go** (Android/iOS) or press `a` for Android emulator / `i` for iOS simulator.

---

## 📱 Screens Implemented

| Module | Screens | Status |
|---|---|---|
| Auth | Login, Register | ✅ Full |
| Dashboard | KPIs, Low Stock, POs, Top Recipes, Branch Revenue | ✅ Full |
| Inventory | Raw Materials, Stock In, Wastage | ✅ Full |
| Inventory | Stock Out, Finished Goods, Transfers | ⚙️ Stub |
| Recipes | List, Detail, Add/Edit, Log Production | ✅ Full |
| Procurement | Indent, POs, Suppliers, GRN | ✅ Full |
| Procurement | Approved Vendors | ⚙️ Stub |
| Sales | Daily Sales | ✅ Full |
| Customers | CRM, Points, Visits | ✅ Full |
| Reports | All 6 report types (dynamic) | ✅ Full |
| Admin | Users, Analytics | ✅ Full |
| Admin | Branches, Audit Logs | ⚙️ Stub |
| Menu | Active Menu | ✅ Full |
| Meal Planning | Weekly Planner | ⚙️ Stub |
| Staff | Shift Scheduler | ⚙️ Stub |

> Stub screens have the navigation shell but show a placeholder — they're easy to fill in following the same pattern as the full screens.

---

## 🏗️ Architecture

```
ForkifyERP/
├── app/                          # Expo Router file-based routing
│   ├── (auth)/login.js           # Login + Register
│   ├── (app)/
│   │   ├── (tabs)/               # Bottom tab navigation
│   │   │   ├── dashboard.js      # Main dashboard
│   │   │   ├── inventory.js      # Inventory hub
│   │   │   ├── recipes.js        # Recipe library
│   │   │   ├── procurement.js    # Procurement hub
│   │   │   └── more.js           # All other modules
│   │   ├── inventory/            # Inventory sub-screens
│   │   ├── recipes/              # Recipe sub-screens
│   │   ├── procurement/          # Procurement sub-screens
│   │   ├── sales/                # Sales screens
│   │   ├── reports/[type].js     # Dynamic report screen
│   │   ├── admin/                # Admin screens
│   │   ├── customers/            # Customer CRM
│   │   ├── staff/                # Staff management
│   │   └── menu/                 # Menu management
│
├── src/
│   ├── services/                 # All 15 API services (1:1 web port)
│   ├── store/                    # Redux Toolkit (auth + recipes slices)
│   ├── hooks/                    # usePermission, useBranch
│   ├── theme/                    # Design tokens
│   └── components/common/        # Shared UI components
```

## 🎨 Design System

Colours, spacing, typography and shadows from `src/theme/index.js` match the web app's design language. The primary brand colour is `#0061d2`.

## 🔐 Roles & Permissions

Same role system as the web app:
- `ROLE_ADMIN` — Full access, all branches
- `ROLE_MANAGER` — Branch + approve actions
- `ROLE_STAFF` — Operations for their branch
- `ROLE_USER` — Read-only

## 🔌 Backend Requirements

This app connects to the same Spring Boot backend as the web app (`com.fooderp`). The API base URL is configured via `EXPO_PUBLIC_API_URL`.

JWT tokens are stored in `AsyncStorage` and attached to every request. 401 responses automatically sign the user out.
