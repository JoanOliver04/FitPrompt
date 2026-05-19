# FitPrompt

> **AI-powered fitness companion that turns a user's body, goals and lifestyle into a fully personalized training and nutrition plan.**

FitPrompt is a production-grade web application that combines a personalized AI coach, a structured workout tracker, a gamification layer (XP, badges, streaks) and a social fitness graph (followers, groups, weekly challenges). It is built on a modern serverless stack with a strict TypeScript codebase, a 16-table relational schema and a two-tier AI pipeline (Groq for the free plan, Anthropic Claude for Premium).

**Authors:** Joan V. Oliver Rosell & Iván Cucarella Pozo
**License:** Proprietary — see [LICENSE](LICENSE)

---

## Table of contents

1. [What problem it solves](#1-what-problem-it-solves)
2. [Tech stack at a glance](#2-tech-stack-at-a-glance)
3. [System architecture](#3-system-architecture)
4. [Feature set](#4-feature-set)
5. [Database design](#5-database-design)
6. [AI pipeline](#6-ai-pipeline)
7. [Plan limits & gating](#7-plan-limits--gating)
8. [Project structure](#8-project-structure)
9. [Local setup](#9-local-setup)
10. [Engineering principles](#10-engineering-principles)
11. [Roadmap & status](#11-roadmap--status)
12. [Authors](#12-authors)

---

## 1. What problem it solves

Generic fitness apps either dump a fixed program on every user or hide their AI behind a paywall and a chat box. FitPrompt does three things differently:

- **Profile-driven, not prompt-driven.** Every AI call is automatically grounded on the user's real profile — age, weight, height, sex, goal, level, equipment, schedule, injuries, allergies, food preferences — plus on-the-fly metabolic calculations (BMR with Mifflin-St Jeor, TDEE with an activity multiplier, target macros). The user never has to "explain themselves" to the model.
- **The plan is structured data, not free text.** The AI returns a 4-week integrated plan split into five sections (routine, diet, recovery, roadmap, FAQ) that the backend parses, persists into the relational schema and re-renders as interactive UI (saveable routine, weekly shopping list, PDF export).
- **Engagement is engineered.** XP, levels (Novato → Superman), weekly streaks tracked by ISO week, idempotent badges, weekly check-ins with AI-generated suggestions, followers, groups and weekly challenges turn a one-shot plan into a long-term product.

---

## 2. Tech stack at a glance

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Server Components by default, native streaming, Edge-ready API routes |
| **Language** | TypeScript (strict, no `any`) | Compile-time safety end-to-end, including DB enums via Prisma |
| **Styling** | TailwindCSS v3 (dark-first) | Design tokens locked to the brand palette in `globals.css` |
| **Auth** | NextAuth.js v4 | Google OAuth + Credentials (bcryptjs) with JWT session strategy |
| **AI — Free** | Groq API · `llama3-70b-8192` | Sub-second time-to-first-token for the free tier |
| **AI — Premium** | Anthropic Claude · `claude-sonnet-4-6` | Higher reasoning quality for Premium plan generation |
| **Database** | PostgreSQL on Supabase | Managed Postgres + connection pooling via PgBouncer |
| **ORM** | Prisma v7 with `@prisma/adapter-pg` driver adapter | Serverless-friendly pool delegation to `pg` |
| **Payments** | Stripe Checkout | Subscription upgrades (Free → Premium) |
| **PDF** | `@react-pdf/renderer` | Server-rendered PDF export of generated plans |
| **Deployment** | Vercel (web) + Supabase (DB) | Fully serverless, zero-ops |
| **Tooling** | ESLint 9, PostCSS, Turbopack | Modern, fast dev loop (`next dev --turbopack`) |

---

## 3. System architecture

```
                ┌────────────────────────────────────────────────────┐
                │                  Next.js 15 (Vercel)               │
                │                                                    │
   Browser ───▶ │  React 19 Server + Client Components               │
                │  ├─ (auth)        login / register                 │
                │  ├─ onboarding    5-step profile capture           │
                │  ├─ (dashboard)   dashboard, chat, profile,        │
                │  │                routines, tracking, social,      │
                │  │                groups, challenges, settings...  │
                │  └─ /api/*        Route Handlers (Node runtime)    │
                │       ├─ auth     NextAuth + register              │
                │       ├─ ai       generate-plan (Groq / Claude)    │
                │       ├─ chat     CRUD chats + streamed messages   │
                │       ├─ user     profile, plan, limits            │
                │       ├─ payment  Stripe Checkout + webhook        │
                │       ├─ tracking workouts, weight, streak, XP     │
                │       ├─ social   follow, groups, notifications    │
                │       └─ admin    role-gated metrics & moderation  │
                └────────────────────────────────────────────────────┘
                          │                       │
                          │ Prisma v7             │ HTTPS
                          ▼                       ▼
            ┌─────────────────────────┐   ┌─────────────────────┐
            │  PostgreSQL (Supabase)  │   │  Groq  /  Anthropic │
            │  16 tables, RLS-ready   │   │  (LLM providers)    │
            └─────────────────────────┘   └─────────────────────┘
```

**Key cross-cutting decisions:**

- **Server Components by default**, `'use client'` only where interactivity is required (chat input, forms, modals). Most data fetching never reaches the browser.
- **Singleton Prisma client** on `globalThis` to survive Next.js hot-reload without exhausting the Supabase pool.
- **Driver-adapter pattern** (`PrismaPg` over `pg`) instead of Prisma's binary engine — the recommended mode for serverless Postgres.
- **All plan limits validated server-side** in `lib/limits.ts` — the UI may surface CTAs, but enforcement never lives in the frontend.
- **Middleware** (`middleware.ts`) gates every protected route (`/dashboard/*`, `/chat/*`, `/profile/*`, `/onboarding`) against the NextAuth JWT before the page renders.
- **Strict typing of the session.** `types/next-auth.d.ts` augments `session.user` with `id` and `plan` so authorization checks are type-safe.

---

## 4. Feature set

### Authentication & onboarding
- Email/password (bcryptjs) and Google OAuth, both flowing through NextAuth credentials provider with JWT sessions.
- Double validation (client + server) on registration, automatic sign-in after sign-up.
- 5-step onboarding form that captures the full `UserProfile` — the single source of truth used by every AI prompt thereafter.

### AI chat
- Two-tier model routing: Groq (`llama3-70b-8192`) for Free, Anthropic Claude (`claude-sonnet-4-6`) for Premium.
- The system prompt is **built from the database, not hard-coded**: `buildUserContext()` (in `lib/prompts.ts`) serializes the user's profile and metabolic calculations into two Markdown tables that are injected as the `system` message on every call.
- Streamed responses with a typing indicator, Markdown rendering, and a structured-plan parser that splits a 4-week response into five sections (routine, diet, recovery, roadmap, FAQ).
- Saveable artifacts directly from the chat: **Save as Routine**, **Export to PDF**, **Generate shopping list**.

### Workout tracker
- `WorkoutLog` stores exercises as JSON (`[{ name, sets: [{ reps, weight }] }]`) so total volume and load progression can be derived without schema churn.
- Routines persist as a normalized 3-table tree (`Routine` → `RoutineDay` → `RoutineExercise`) so they can be edited, reordered and reused across weeks.
- Weekly streak (`Streak`) tracked by ISO week to avoid timezone ambiguity, with `currentStreak` / `bestStreak` and an idempotent upsert on workout completion.

### Gamification
- **XP**: `+50` per workout, `+10` per weight log, `+200` per completed week — accumulated in `UserXP.totalXP`. The level (10 tiers, Novato → Superman) is **derived**, never persisted, via `deriveLevel()`.
- **Badges**: 12 achievements with idempotent unlock (`@@unique([userId, badge])`). Free plan unlocks the first 4; Premium unlocks the rest.
- **Weekly challenges**: a catalog defined in the frontend, accepted and completed per ISO week (`UserChallenge`, unique on `[userId, challengeId, weekStart]`).

### Social
- Self-referential follow graph (`Follow`, unique on `[followerId, followingId]`, indexed both ways).
- Premium-only groups (`Group` + `GroupMember`, unique on `[groupId, userId]`) with ranking against group members.
- In-app notification feed (`Notification`) with compound indexes on `(userId, createdAt)` and `(userId, read)` for unread counters.

### Progress & analytics
- Premium weight tracking (`WeightLog`) feeds time-series charts of body-weight evolution.
- Weekly check-in (`WeeklyCheckIn`, unique per `[userId, weekStart]`) where the user describes their week in free text; the backend forwards it to Groq, generates 3 personalized suggestions and stores them as serialized JSON.

### Billing
- Stripe Checkout drives Free → Premium upgrades.
- Plan transitions are reflected in `User.plan`; every gated feature checks against this column server-side.

### Admin
- Role-based access via `User.role` (`USER` | `ADMIN`).
- Admins bypass plan limits (centralized in `checkUserLimits()`), enabling internal QA and moderation without test accounts.

---

## 5. Database design

PostgreSQL on Supabase, 16 tables, organized in five functional domains:

| Domain | Tables |
|---|---|
| **Identity & access** | `User`, `UserProfile` |
| **Chat & AI** | `Chat`, `Message`, `DailyMessageCount`, `WeeklyCheckIn` |
| **Physical progress** | `WorkoutLog`, `WeightLog`, `Streak`, `Routine`, `RoutineDay`, `RoutineExercise` |
| **Gamification** | `Achievement`, `UserXP`, `UserChallenge` |
| **Social** | `Follow`, `Group`, `GroupMember`, `Notification` |

### Relationship diagram

```
User ──────────────── UserProfile          (1:1)
  │
  ├── Chat ─── Message                     (1:N → 1:N)
  ├── WorkoutLog                           (1:N)
  ├── WeightLog                            (1:N)
  ├── Achievement                          (1:N)
  ├── DailyMessageCount                    (1:N)
  ├── Streak                               (1:1)
  ├── UserXP                               (1:1)
  ├── UserChallenge                        (1:N)
  ├── WeeklyCheckIn                        (1:N)
  ├── Notification                         (1:N)
  ├── Follow [follower] ←→ Follow [following]   (N:N self-referencing)
  ├── Group (creator)                      (1:N)
  ├── GroupMember                          (1:N)
  └── Routine ─── RoutineDay ─── RoutineExercise  (1:N → 1:N → 1:N)

Group ─── GroupMember                      (1:N)
```

### Design highlights

- **`UserProfile` is the AI's source of truth.** Age is **not stored** — it is derived in real time from `birthDate` so it stays correct without scheduled jobs. Macros, BMR (Mifflin-St Jeor) and TDEE are likewise computed at prompt time from `weight`, `height`, `gender`, `goal`, `daysPerWeek`.
- **All user-owned tables cascade-delete from `User`**, making account deletion a single transaction.
- **Uniqueness constraints encode invariants**: one profile per user, one daily-message-count row per user/day, one streak per user, one check-in per user/week, no duplicate follows, no duplicate group memberships, no duplicate badge unlocks.
- **Composite indexes** on `Notification(userId, createdAt)` and `Notification(userId, read)` keep the notification dropdown fast as the table grows.
- **Driver-adapter Prisma client** (`@prisma/adapter-pg`) with `pgbouncer=true&connection_limit=1` keeps the Supabase pool healthy under bursty serverless traffic.
- **Singleton pattern on `globalThis`** in [lib/db.ts](lib/db.ts) prevents Next.js hot-reload from leaking Prisma instances.

A full database walkthrough — tables, columns, business rules and the eight critical SQL queries (login lookup, profile upsert, chat listing, message history, rate-limit increment, streak update, XP increment, weekly check-in) — lives in [docs/database-description.md](docs/database-description.md).

---

## 6. AI pipeline

The AI layer is split across three files for separation of concerns:

| File | Responsibility |
|---|---|
| [lib/prompts.ts](lib/prompts.ts) | Builds the system + user prompts from a `UserProfile` |
| [lib/groq.ts](lib/groq.ts) / [lib/anthropic.ts](lib/anthropic.ts) | Provider clients (Free / Premium) |
| [lib/ai.ts](lib/ai.ts) | Orchestration: model selection, generation, parsing into the 5 plan sections |

### How a generation flows

1. Client calls `POST /api/ai/generate-plan` (or sends a chat message).
2. The handler loads the user and their `UserProfile` via Prisma.
3. `lib/limits.ts` validates the user's plan and increments `DailyMessageCount` atomically (rate-limit upsert with `count + 1` and `HTTP 429` if the free quota is exhausted).
4. `generarSystemPrompt(profile)` assembles the system message — including the profile table and a metabolic-data table (BMR, TDEE, target calories/protein/carbs/fat, BMI, activity multiplier).
5. The provider is chosen from `User.plan`. Groq for Free, Claude for Premium.
6. The response is parsed by `parsePlanSections()` into structured chunks the UI can render as interactive components (routine card, diet table, shopping list, PDF download).

### Specialized prompt builders

Beyond the combined plan, the system exposes four targeted prompts — each drawing on a different slice of the profile:

| Function | Generates | DB inputs |
|---|---|---|
| `generarSystemPrompt` | FitCoach persona + user context | Full profile + metabolic calculations |
| `generarPromptRutina` | Weekly training routine | goal, level, daysPerWeek, sessionTime, workoutType, injuries |
| `generarPromptDieta` | Daily meal plan with grams | goal, weight, allergies, foodPreferences, schedule |
| `generarPromptListaCompra` | Weekly shopping list (JSON) | goal, macros, allergies, foodPreferences |
| `generarPromptCombinado` | 4-week integrated plan (5 sections) | Full profile |

### Safety constraints baked into the prompt

- `injuries` and `allergies` are injected as **warning blocks (`⚠️`)** so the model treats them as hard exclusions, not preferences.
- Numerical targets (kcal, protein g/day, etc.) are **computed deterministically in code** and passed to the model — the model styles and contextualizes the plan, but never invents the macros.

---

## 7. Plan limits & gating

| Feature | Free | Premium |
|---|---|---|
| AI messages / day | 5 | Unlimited |
| Saved chats | 3 | Unlimited |
| AI provider | Groq (Llama 3 70B) | Anthropic Claude Sonnet 4.6 |
| Progress charts | ✗ | ✓ |
| Social groups | ✗ | ✓ |
| Badges | First 4 | All 12 |
| Routine PDF export | ✓ | ✓ |
| Weekly challenges | ✓ | ✓ (with rewards) |

Limits are enforced in `lib/limits.ts` (`checkUserLimits()`), invoked from every gated route handler. Admins bypass.

---

## 8. Project structure

```
app/
├── (auth)/             public routes — login, register
├── (dashboard)/        protected routes — dashboard, chat, profile,
│                       routines, tracking, social, groups, challenges,
│                       exercises, achievements, compare, settings, admin
├── onboarding/         5-step profile capture
├── pricing/            plan comparison + Stripe Checkout entry
└── api/                Route Handlers
    ├── auth/           NextAuth + register
    ├── ai/             generate-plan
    ├── chat/           CRUD chats, messages, streaming
    ├── user/           profile, plan
    ├── payment/        Stripe Checkout + webhook
    ├── tracking/       workouts, weight, XP, streak
    ├── checkin/        weekly check-in + AI suggestions
    ├── social/         follow / unfollow, feed
    ├── groups/         create, join, leaderboard
    ├── notifications/  list + mark-as-read
    ├── routines/       save / fetch / delete
    ├── shopping-list/  generated from current diet
    ├── challenges/     accept / complete
    ├── admin/          role-gated endpoints
    └── health/         liveness probe

components/
├── ui/                 Button, Input, Card, Modal, Toast, PremiumGate…
├── layout/             Sidebar, Header, BottomNav
├── chat/               ChatInterface, MessageBubble, ChatInput,
│                       ChatSidebar, ExportPdfButton, SaveRoutineButton,
│                       ShoppingListCard, TypingIndicator
├── dashboard/          StatsCard, WeekCalendar, XP & streak widgets
├── exercises/          exercise catalog UI
├── tracking/           workout & weight log forms, charts
├── profile/            profile editor
├── social/, groups/    feed, group cards, leaderboards
├── challenges/         challenge cards
├── admin/              admin tables & moderation panels
├── auth/               LoginForm, RegisterForm
└── pdf/                @react-pdf/renderer templates

lib/                    db, auth, ai, groq, anthropic, prompts, limits,
                        roles, xp, streak, badges, challenges, chat,
                        checkin, dashboard, exercises, notifications,
                        pdf-parser, routineParser, age, utils

prisma/
├── schema.prisma       single source of truth (16 models, 8 enums)
└── migrations/         versioned SQL migrations

types/                  shared TS types + next-auth.d.ts augmentation
hooks/                  useAuth, useLocalStorage, …
store/                  client-side state
docs/                   database-description.md (full DB walkthrough)
middleware.ts           route protection
```

---

## 9. Local setup

**Prerequisites:** Node.js ≥ 20, npm, a Supabase project, Groq + Anthropic API keys, a Stripe account (test mode is fine), and a Google OAuth client.

```bash
npm install
cp .env.local.example .env.local
# Fill in: DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,
#          GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
#          GROQ_API_KEY, ANTHROPIC_API_KEY,
#          STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID

npx prisma generate
npx prisma migrate deploy       # applies migrations to Supabase

npm run dev                     # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Starts Next.js with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Serves the production build |
| `npm run lint` | ESLint over the whole project |

### Main routes

| Route | Description |
|---|---|
| `/` | Public landing page |
| `/login`, `/register` | Auth |
| `/onboarding` | 5-step profile capture (post-signup) |
| `/dashboard` | Main panel: stats, week calendar, XP, streak |
| `/chat`, `/chat/[id]` | Chat list + AI conversation |
| `/profile` | Editable profile |
| `/routines` | Saved routines |
| `/tracking` | Workouts & weight logs |
| `/social`, `/groups`, `/challenges` | Social fitness graph |
| `/achievements` | Badge wall |
| `/pricing` | Plan comparison + Stripe Checkout |
| `/admin` | Role-gated admin panel |

---

## 10. Engineering principles

- **TypeScript strict, no `any`.** Every public type lives in `types/index.ts`. Prisma enums propagate up to the React layer.
- **Server-first.** Server Components by default; `'use client'` is a deliberate choice, not the norm.
- **Authorization is server-side.** UI hides what the user can't use; the backend enforces what the user can't do.
- **Idempotent writes.** XP increments, streak updates, badge unlocks, daily message counts and weekly check-ins are all expressed as upserts with unique constraints — replaying the same event never double-counts.
- **Derive, don't store.** Age is derived from `birthDate`. Level is derived from `totalXP`. Macros, BMR and TDEE are recomputed from `UserProfile` on every prompt. Less to keep in sync, less to migrate.
- **Single asset convention.** All static assets live under `assets/<category>/` and are imported statically (`import logo from '@/assets/logo/logo.png'`). Nothing in `public/`. This keeps the bundler in charge of hashing and caching.
- **Brand palette is tokenized.** Four CSS variables (`--bg-primary #101010`, `--accent #FF471A`, `--text-primary #FFFFFF`, `--text-secondary #E0E0E0`) — every component reads from those, never from hex literals.

---

## 11. Roadmap & status

The project is built phase by phase. Major phases delivered:

- **Phase 01** — Scaffolding: Next.js 15, Tailwind v3, dark mode, design tokens, base layout.
- **Phase 02** — Authentication: NextAuth (Google + Credentials), middleware-protected routes, register flow with auto-login, session typing.
- **Phase 03** — Core AI: Groq + Anthropic clients, prompt builders, `/api/ai/generate-plan`, streaming chat, plan limits.
- **Phase 04+** — Database (Prisma + Supabase), workout tracking, gamification (XP, streaks, badges), social (followers, groups, challenges), Stripe billing, PDF export, weekly check-in, admin panel.

Active areas: deeper analytics, mobile-first polish, automated test coverage and observability.

---

## 12. Authors

**Joan V. Oliver Rosell** — full-stack engineering, AI integration, database architecture, product design.

**Iván Cucarella Pozo** — full-stack engineering, frontend systems, gamification & social features.

For inquiries about the project, partnerships or hiring, please reach out via the contact details on our portfolios.

---

© 2026 Joan V. Oliver Rosell & Iván Cucarella Pozo. All rights reserved. See [LICENSE](LICENSE).
