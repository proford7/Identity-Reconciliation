# Identity Reconciliation System

A full-stack **Identity Resolution Engine** that links customer identities across multiple purchases. Built with **React + TypeScript** (frontend) and **Node.js + Express + Prisma + MySQL** (backend).

---

## Tech Stack

| Layer      | Technology                              |
| ---------- | --------------------------------------- |
| Frontend   | React 19, TypeScript, Vite, Axios       |
| Backend    | Node.js, Express, TypeScript            |
| Database   | MySQL                                   |
| ORM        | Prisma                                  |
| Styling    | Vanilla CSS (dark-mode, glassmorphism)  |

---

## Architecture

```
┌──────────────┐       POST /identify       ┌──────────────────────┐
│   React UI   │  ────────────────────────▸  │   Express Backend    │
│  (Vite dev)  │  ◂────────────────────────  │                      │
└──────────────┘       JSON response        │  Controller          │
                                             │    ↓                 │
                                             │  Service (logic)     │
                                             │    ↓                 │
                                             │  Prisma → MySQL      │
                                             └──────────────────────┘
```

**Separation of Concerns:**

- **Controller** — validates request, calls service, sends response.
- **Service** — implements the reconciliation algorithm.
- **Prisma Client** — database access layer.
- **Middleware** — centralized error handling.

---

## Identity Reconciliation Logic

### Algorithm

1. **Search** for existing contacts where `email` OR `phoneNumber` matches.
2. **No match** → create a new **primary** contact and return.
3. **Match found** →
   - Resolve all linked primary IDs (follow `linkedId` chains).
   - If **multiple primaries** collide → the **oldest** stays primary; others are demoted to secondary with their clusters re-linked.
   - If the incoming request carries **new information** not yet in the cluster → create a **secondary** contact.
4. **Build response** with the primary's email/phone first, followed by secondaries (deduplicated).

### Contact Model

| Field            | Type      | Description                                   |
| ---------------- | --------- | --------------------------------------------- |
| `id`             | Int (PK)  | Auto-incremented                              |
| `email`          | String?   | Customer email                                |
| `phoneNumber`    | String?   | Customer phone                                |
| `linkedId`       | Int?      | References the primary contact's ID           |
| `linkPrecedence` | String    | `"primary"` or `"secondary"`                  |
| `createdAt`      | DateTime  | Auto-set on creation                          |
| `updatedAt`      | DateTime  | Auto-updated                                  |
| `deletedAt`      | DateTime? | Soft-delete timestamp                         |

---

## Setup Instructions

### Prerequisites

- **Node.js** ≥ 18
- **MySQL** server running locally (or remotely)
- **npm** or **yarn**

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. MySQL Setup

Create the database:

```sql
CREATE DATABASE identity_reconciliation;
```

### 3. Environment Variables

**Backend** — copy `.env.example` to `.env` and fill in your MySQL credentials:

```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/identity_reconciliation"
PORT=3000
```

**Frontend** — copy `.env.example` to `.env`:

```env
VITE_API_URL=http://localhost:3000
```

### 4. Prisma Migration

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run

```bash
# Backend (from backend/)
npm run dev

# Frontend (from frontend/)
npm run dev
```

- Backend runs at: `http://localhost:3000`
- Frontend runs at: `http://localhost:5173`

---

## API Reference

### `POST /identify`

**Request:**

```json
{
  "email": "jane@example.com",
  "phoneNumber": "+1234567890"
}
```

Either `email` or `phoneNumber` (or both) must be provided.

**Response:**

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["jane@example.com", "jane.work@example.com"],
    "phoneNumbers": ["+1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

### `GET /health`

Returns `{ "status": "ok", "timestamp": "..." }`

---

## Example Test Scenario

```bash
# 1. New contact
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "phoneNumber": "+100"}'

# 2. Same email, different phone → links as secondary
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "phoneNumber": "+200"}'

# 3. New contact with different email and phone
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "bob@example.com", "phoneNumber": "+300"}'

# 4. Merge! alice's phone + bob's email → two primaries merge
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "bob@example.com", "phoneNumber": "+100"}'
```

---

## Deployment

### Backend

```bash
cd backend
npm run build          # Compiles TS → dist/
node dist/server.js    # Run in production
```

Set `DATABASE_URL` and `PORT` environment variables in your hosting platform.

### Frontend

```bash
cd frontend
npm run build    # Outputs to dist/
```

Deploy the `dist/` folder to any static hosting (Vercel, Netlify, S3, etc.). Set `VITE_API_URL` to your backend's production URL **before** building.

---

## Project Structure

```
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   │   └── identifyController.ts
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   ├── prisma/
│   │   │   └── client.ts
│   │   ├── routes/
│   │   │   └── identifyRoutes.ts
│   │   ├── services/
│   │   │   └── identifyService.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IdentifyForm.tsx
│   │   │   └── ResponseDisplay.tsx
│   │   ├── pages/
│   │   │   └── HomePage.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md
```
