# 📅 E-Cədvəl (QrupTap)

> Multi-tenant university scheduling SaaS — built for faculties to generate, manage, and share class schedules without conflicts.

🔗 **Live demo:** [e-cedvel.vercel.app](https://e-cedvel.vercel.app)

<!-- 📸 Add 2–3 screenshots or a short GIF here: landing page, admin panel, schedule generator in action -->
<!-- ![screenshot](./docs/screenshot-1.png) -->

---

## 🧩 Problem

University faculties often build class schedules manually in spreadsheets — a slow process prone to room and instructor conflicts, with no easy way to share updates with students. E-Cədvəl automates this for multiple universities at once, each with its own isolated data and admins.

## ✨ Features

- 🏫 **Multi-tenant architecture** — each university operates in an isolated workspace with its own admins and data
- 👥 **Role-based access** — superadmin (platform owner) vs. university-admin roles, enforced via Postgres Row Level Security (RLS)
- ⚡ **Real-time conflict detection** — flags overlapping rooms/instructors/time slots as schedules are built
- 📤 **Export** — schedules can be exported to CSV and PDF
- ✉️ **Email invite system** — university admins invite staff via Resend-powered transactional emails
- 🖥️ **Admin dashboard** — dedicated tabs for managing faculties, groups, courses, and instructors

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌────────────────┐
│   Next.js App    │ ───▶ │  Supabase (Postgres)  │ ───▶ │  Row Level      │
│  (App Router,     │      │  Auth + Database +     │      │  Security per   │
│   TypeScript)     │      │  Realtime               │      │  tenant         │
└─────────────────┘      └──────────────────────┘      └────────────────┘
        │                                                        
        ▼                                                        
┌─────────────────┐      ┌──────────────────────┐
│  Resend (email    │      │  CSV / PDF export     │
│  invites)          │      │  generation             │
└─────────────────┘      └──────────────────────┘
```

- **Frontend:** Next.js (App Router) + TypeScript, deployed on Vercel
- **Backend/DB:** Supabase (Postgres, Auth, Realtime subscriptions)
- **Multi-tenancy:** enforced at the database layer via RLS policies keyed on `university_id`, not just in application code
- **Email:** Resend for admin invite flows

## 🛠️ Tech Stack

![Next.js](https://img.shields.io/badge/-Next.js-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/-TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/-Vercel-000000?style=flat-square&logo=vercel)
![Resend](https://img.shields.io/badge/-Resend-000000?style=flat-square&logo=resend&logoColor=white)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier is enough for local dev)
- A Resend API key (for email invites)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/etikhacker/e-cedvel.git
cd e-cedvel

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key
```

```bash
# 4. Run database migrations (via Supabase CLI or dashboard SQL editor)
supabase db push

# 5. Start the dev server
npm run dev
```

App runs at `http://localhost:3000`.

## 📌 Status

Built and iterated as a real product — submitted to the **ABB Innovation** incubation program. Actively maintained.

## 📄 License

MIT
