# OKR Tracker — Technical Specification

## 1. Overview

OKR Tracker is a single-tenant web application that enables a user to define Objectives and Key Results (OKRs), attach KPIs to Key Results, create tasks, and automatically align tasks to OKRs using a TF-IDF text-matching algorithm. Progress is derived at read time from completed task alignments — no denormalized counters are stored.

---

## 2. Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (base-ui headless primitives) |
| ORM | Prisma v7 |
| Database | SQLite via `@prisma/adapter-libsql` |
| Auth | NextAuth v5 (JWT strategy, Credentials provider) |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Icons | lucide-react |
| Password Hashing | bcryptjs (salt rounds: 12) |

---

## 3. Data Model

```
User
 ├── Objective[]
 │    └── KeyResult[]
 │         ├── KPI[]
 │         └── TaskAlignment[]
 └── Task[]
      └── TaskAlignment[]
```

### User
| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| email | String | Unique |
| name | String | |
| passwordHash | String | bcrypt |
| shareToken | String | Unique CUID, for future sharing |
| createdAt | DateTime | |

### Objective
| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| userId | String | FK → User (cascade delete) |
| title | String | |
| description | String? | |
| status | String | ACTIVE \| COMPLETED \| PAUSED |
| order | Int | Drag-and-drop sort position |
| createdAt | DateTime | |

### KeyResult
| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| objectiveId | String | FK → Objective (cascade delete) |
| title | String | |
| description | String? | |
| type | String | PERCENTAGE \| COUNT |
| targetValue | Float | Goal amount |
| unit | String? | e.g. %, $, units |
| order | Int | Sort position |
| createdAt | DateTime | |

**PERCENTAGE** KRs track fractional progress (sum of contribution %). **COUNT** KRs track discrete completions (each done task = 1 unit).

### KPI
| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| keyResultId | String | FK → KeyResult (cascade delete) |
| title | String | |
| description | String? | |
| keywords | String | Comma-separated terms for alignment |
| order | Int | Sort position |
| createdAt | DateTime | |

KPIs are optional sub-dimensions of a Key Result used to increase alignment precision. The alignment algorithm scores against KPI keywords at the highest weight.

### Task
| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| userId | String | FK → User (cascade delete) |
| title | String | |
| description | String? | |
| status | String | TODO \| IN_PROGRESS \| DONE |
| completedAt | DateTime? | Set when status → DONE |
| createdAt | DateTime | |

### TaskAlignment
| Field | Type | Notes |
|---|---|---|
| id | String (CUID) | PK |
| taskId | String | FK → Task (cascade delete) |
| keyResultId | String | FK → KeyResult (cascade delete) |
| kpiId | String? | FK → KPI (nullable, cascade delete) |
| contribution | Float | 0–100 (%) for PERCENTAGE; 1 for COUNT |
| isOverridden | Boolean | True if user manually set alignment |
| confidence | Float | Raw algorithm score (0–1) |
| createdAt | DateTime | |

**One alignment per task** is enforced by the API: creating a new alignment deletes any existing one for the task first.

---

## 4. API Routes

All routes under `/api/` authenticate via `auth()` from NextAuth. Every query is scoped to `session.user.id`.

### Auth
| Method | Path | Description |
|---|---|---|
| ANY | `/api/auth/[...nextauth]` | NextAuth handler |
| POST | `/api/register` | Create account (email, name, password) |

### Objectives
| Method | Path | Description |
|---|---|---|
| GET | `/api/objectives` | List with KRs, KPIs, alignments |
| POST | `/api/objectives` | Create |
| GET | `/api/objectives/[id]` | Detail with full children |
| PATCH | `/api/objectives/[id]` | Update title/description/status |
| DELETE | `/api/objectives/[id]` | Delete (cascade) |
| POST | `/api/objectives/reorder` | Bulk reorder by ID array |

### Key Results
| Method | Path | Description |
|---|---|---|
| GET | `/api/keyresults` | List all active KRs with KPIs |
| POST | `/api/objectives/[id]/keyresults` | Create under objective |
| PATCH | `/api/keyresults/[id]` | Update |
| DELETE | `/api/keyresults/[id]` | Delete (cascade) |
| POST | `/api/keyresults/reorder` | Bulk reorder |

### KPIs
| Method | Path | Description |
|---|---|---|
| POST | `/api/objectives/[id]/kpis` | Create KPI under a KR |
| POST | `/api/kpis/reorder` | Bulk reorder |

### Tasks
| Method | Path | Description |
|---|---|---|
| GET | `/api/tasks` | List with alignments |
| POST | `/api/tasks` | Create with auto or manual alignment |
| PATCH | `/api/tasks/[id]` | Update status (sets completedAt) |
| DELETE | `/api/tasks/[id]` | Delete |
| POST | `/api/tasks/[id]/alignments` | Replace alignment |

### Alignments
| Method | Path | Description |
|---|---|---|
| PATCH | `/api/alignments/[id]` | Update contribution (manual override) |
| DELETE | `/api/alignments/[id]` | Remove alignment |
| POST | `/api/align/preview` | Return top alignment suggestions (no write) |

### Profile
| Method | Path | Description |
|---|---|---|
| PATCH | `/api/profile` | Update name and/or password |

---

## 5. Alignment Algorithm

**File:** `src/lib/alignment.ts`

A lightweight TF-IDF-style approach. No external API or ML model is required.

### Pipeline

```
task title + description
        ↓
    tokenize()          → lowercase, strip punctuation, remove stopwords, stem
        ↓
   for each KR:
    scoreKR()           → weighted overlap across title, description, KPI keywords
        ↓
   filter confidence >= 0.1
        ↓
   return top-1 result
```

### Tokenization
- Lowercase, remove non-alphanumeric chars
- Filter 50 common English stopwords
- Stem suffixes: `-ing`, `-tion`, `-ed`, `-ly`, `-es`, `-s`

### Scoring Weights
| Source | Weight |
|---|---|
| KR title | 2.0 |
| KR description | 1.0 |
| KPI keywords | 2.0 |
| KPI title | 1.5 |
| KPI description | 1.0 |

Score for a given field = `overlap(taskTokens, fieldText) × weight`, where `overlap` = `matchingTokens / sqrt(fieldTokenCount)`.

Final KR score = max(KR-level score, best KPI score).

### Output
```typescript
interface AlignmentSuggestion {
  kpiId: string | null;
  keyResultId: string;
  keyResultType: string;   // PERCENTAGE | COUNT
  contribution: number;    // % (capped 100) or 1 for COUNT
  confidence: number;      // 0–1
  // display fields: kpiTitle, keyResultTitle, objectiveTitle
}
```

Only the single best match (confidence ≥ 0.1) is returned to keep task alignment simple.

---

## 6. Progress Calculation

**File:** `src/lib/progress.ts`

Progress is computed from database state at read time — no stored progress column exists.

### Key Result Progress
```
COUNT  → min(count of DONE tasks aligned to this KR, targetValue)
PERCENT → min(sum of contributions from DONE tasks / 100, 1) × targetValue
```

### Objective Progress
```
average(each KR's progress as % of targetValue) → rounded integer 0–100
```

---

## 7. Authentication

**File:** `src/lib/auth.ts`

- **Strategy:** JWT (no database sessions needed)
- **Provider:** Credentials (email + bcrypt password check)
- **Session shape:** `session.user.id` populated via JWT callback
- **Protected layout:** `src/app/(app)/layout.tsx` calls `auth()` server-side and redirects to `/login` if no session
- **Sign-out:** client-side `signOut({ callbackUrl: "/login" })`

---

## 8. Frontend Structure

### Route Groups

```
src/app/
├── (auth)/          Public routes
│   ├── login/
│   └── register/
├── (app)/           Protected routes (layout.tsx = auth guard + sidebar)
│   ├── dashboard/
│   ├── objectives/
│   │   ├── [id]/
│   │   └── new/
│   ├── tasks/
│   │   └── new/
│   ├── gaps/
│   ├── report/
│   └── profile/
└── api/             API handlers
```

### Pages
| Route | Type | Description |
|---|---|---|
| `/dashboard` | Server | Summary cards: active objectives, task completion rate, recent tasks |
| `/objectives` | Server + Client | List with drag-and-drop reordering |
| `/objectives/[id]` | Server + Client | Full OKR editor: KRs, KPIs, aligned tasks, drag-and-drop |
| `/tasks` | Server + Client | Task table with inline status editor and alignment manager |
| `/tasks/new` | Client | Create task with live alignment preview + manual override picker |
| `/gaps` | Server | KRs sorted by progress; red < 20%, amber < 50% |
| `/report` | Server | Printable full OKR report |
| `/profile` | Server + Client | Name and password update |

### Rendering Pattern
Pages follow a consistent pattern: a **server component** fetches data via Prisma and passes it to a **client component** for interactivity. This avoids unnecessary client-side data fetching for initial loads.

---

## 9. File Structure

```
src/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx
│   ├── (app)/layout.tsx              Auth guard + sidebar
│   ├── (app)/dashboard/page.tsx
│   ├── (app)/objectives/
│   │   ├── page.tsx
│   │   ├── ObjectivesSortable.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx + ObjectiveDetailClient.tsx
│   ├── (app)/tasks/
│   │   ├── page.tsx
│   │   ├── TaskTableClient.tsx
│   │   └── new/page.tsx
│   ├── (app)/gaps/page.tsx
│   ├── (app)/report/page.tsx
│   ├── (app)/profile/
│   │   ├── page.tsx
│   │   └── ProfileForm.tsx
│   ├── api/                          (see API Routes section)
│   ├── layout.tsx                    Root layout
│   ├── page.tsx                      Redirect → /dashboard
│   └── globals.css
├── components/
│   ├── shared/
│   │   ├── Sidebar.tsx
│   │   └── Providers.tsx
│   └── ui/                           shadcn/ui components
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── alignment.ts
│   ├── progress.ts
│   └── utils.ts
└── types/

prisma/
├── schema.prisma
├── dev.db
└── migrations/
```

---

## 10. Key Design Decisions

### One Alignment Per Task
Each task aligns to exactly one Key Result (optionally one KPI). This keeps contribution tracking unambiguous and the UI simple. Enforced server-side by deleting existing alignments before creating a new one.

### Progress at Read Time
No `progress` column is stored. All progress figures are derived from `TaskAlignment.contribution` × `Task.status = DONE`. Avoids sync bugs at the cost of slightly more query work per read.

### Algorithm Over LLM
Task→KR alignment uses TF-IDF overlap rather than an LLM API call. This keeps the app offline-capable, free to run, and fast (no network round-trip per task creation). The tradeoff is lower accuracy on semantic matches.

### Server + Client Split
Data fetching happens in server components (via `auth()` + Prisma). Client components handle interactivity only. This minimizes client bundle size and ensures auth checks happen server-side.

### SQLite → Postgres Migration Path
The Prisma libsql adapter is swapped out in `prisma.config.ts`. No application code changes are needed to move to Neon or Vercel Postgres — only the adapter and `DATABASE_URL`.

---

## 11. Security

| Concern | Mitigation |
|---|---|
| Authentication | JWT httpOnly cookies via NextAuth |
| Authorization | All API routes check `session.user.id`; all queries scoped to that ID |
| Password storage | bcrypt, salt rounds 12 |
| Password change | Requires current password verification |
| SQL injection | Not possible — Prisma ORM with parameterized queries |
| XSS | React escapes output by default; no `dangerouslySetInnerHTML` |

---

## 12. Environment Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | No | `file:./prisma/dev.db` | SQLite path or Postgres connection string |
| `NEXTAUTH_SECRET` | Yes (prod) | — | JWT signing secret |
| `AUTH_SECRET` | Yes (prod) | — | NextAuth v5 alias for NEXTAUTH_SECRET |

---

## 13. Known Limitations

- **Single-user:** No teams, sharing, or org-level OKRs
- **No time periods:** OKRs are not bucketed by quarter or cycle
- **Semantic gaps:** Alignment algorithm misses synonyms and context not reflected in KPI keywords
- **No audit log:** No history of status changes or contribution edits
- **No notifications:** No alerts for stale tasks or low-progress KRs
