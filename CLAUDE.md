# CLAUDE.md — PDQ Scope Tracker

This file gives Claude Code full context on the project structure, conventions,
and current state so you can make changes without re-explaining the architecture.

---

## What This App Is

**PDQ Scope Tracker** is a field operations app for PDQ Restoration — a water and
smoke damage cleanup company. Field technicians use it to create jobs, log daily
room-by-room scope checklists, track hours and equipment, and submit daily sheets.
Estimators use it to review completed work and generate PDF billing reports.

---

## Infrastructure

| Layer | Service | Details |
|---|---|---|
| Framework | Expo SDK 51 + React Native 0.74.5 | File-based routing via Expo Router v3 |
| Language | TypeScript | Strict mode throughout |
| Hosting | Cloudflare Pages | Deployed via `wrangler deploy` |
| Database | Supabase | Project exists — **auth currently bypassed in prototype** |
| Storage | localStorage (prototype) | Will migrate to Supabase tables |
| PDF | expo-print | `lib/pdf.ts` + `components/report/ReportBuilder.tsx` |
| Photos | expo-image-picker | `hooks/usePhotos.ts` + `components/ui/PhotoPicker.tsx` |
| Bundle ID | `com.pdqrestoration.scopetracker` | |
| Scheme | `pdqscope` | |

---

## How to Run

```bash
npm install

# Web dev server
npm run web

# Deploy to Cloudflare
npm run deploy
```

Requires `.env.local` (never commit this):
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## File Structure

```
pdq-scope-tracker/
├── app/
│   ├── _layout.tsx                   # Root layout — AppProvider, auth redirect (bypassed)
│   ├── (auth)/
│   │   └── login.tsx                 # Login screen — redirects to app in prototype mode
│   └── (app)/
│       ├── _layout.tsx               # App group layout
│       ├── index.tsx                 # Home — project list + New Project modal
│       └── project/
│           ├── [id].tsx              # Project detail — sheet list, Create Today's Sheet
│           ├── tech/[id].tsx         # Tech sheet — room checklist, submit
│           └── estimator/[id].tsx    # Estimator view — read-only summary
│
├── components/
│   ├── cards/
│   │   └── ProjectCard.tsx           # Project list card component
│   ├── report/
│   │   └── ReportBuilder.tsx         # PDF report builder (expo-print)
│   ├── scope/
│   │   ├── RoomSection.tsx           # Room accordion — items, yes/no, hours, notes
│   │   ├── ContentsSection.tsx       # Phase 2 contents card
│   │   ├── WallsCeilingUI.tsx        # Walls & ceiling demolition entry
│   │   ├── FlooringSection.tsx       # Flooring chip selector
│   │   └── AsbestosSection.tsx       # Asbestos / lead testing items
│   └── ui/
│       ├── Badge.tsx                 # Status badges
│       ├── Button.tsx                # Shared button component
│       └── PhotoPicker.tsx           # Photo capture / picker UI
│
├── constants/
│   ├── colors.ts                     # PDQ brand colors
│   └── templates.ts                  # SCOPE_TEMPLATE, ROOM_PRESETS, makeRoomItems()
│
├── context/
│   └── AppContext.tsx                # Auth state — Supabase hooks (bypassed in prototype)
│
├── hooks/
│   ├── useProject.ts                 # Loads project + sheets
│   ├── useSheet.ts                   # Loads sheet + rooms + items, updateItem, submitSheet
│   └── usePhotos.ts                  # Photo helpers
│
├── lib/
│   ├── storage.ts                    # localStorage CRUD — Projects, Sheets, Rooms, Items, Photos
│   ├── supabase.ts                   # Supabase client init
│   ├── templates.ts                  # Template helpers (may overlap constants/templates.ts)
│   ├── photos.ts                     # Photo storage helpers
│   └── pdf.ts                        # PDF generation logic
│
├── supabase/                         # Migrations + Supabase config
├── app.json                          # Expo config
├── wrangler.jsonc                    # Cloudflare Workers config
├── .env.local                        # SUPABASE_URL + ANON_KEY — not committed
└── CLAUDE.md                         # This file
```

---

## Screen Flow

```
Home (app/(app)/index.tsx)
  └── New Project modal → createProject()
        └── Project Detail (app/(app)/project/[id].tsx)
              └── Create Today's Sheet
                    ├── Tech Sheet (project/tech/[id].tsx)
                    │     ├── ContentsSection (Phase 2)
                    │     ├── RoomSection[] (one per added room)
                    │     │     ├── Item list — status toggle
                    │     │     ├── WallsCeilingUI
                    │     │     ├── FlooringSection
                    │     │     └── AsbestosSection
                    │     └── Submit (gates: no pending, no done missing hours)
                    └── Estimator View (project/estimator/[id].tsx)
```

---

## Data Model (localStorage keys — future Supabase tables)

### `pdq_projects` — `Project[]`
```ts
{
  id: string;
  job_name: string;
  address: string;
  job_type: 'Water Mitigation' | 'Fire & Smoke' | 'General';
  water_category: 'cat2' | 'cat3' | null;
  status: 'active' | 'complete' | 'archived';
  created_by: string;
  created_at: string;
  updated_at: string;
}
```

### `pdq_sheets` — `Sheet[]`
```ts
{
  id: string;
  project_id: string;
  tech_name: string | null;
  hours_type: 'regular' | 'after';
  contents_status: 'yes' | 'no' | 'not_sure' | null;
  contents_boxes: number | null;
  contents_hours: number | null;
  submitted: boolean;
  submitted_at: string | null;
  date: string;              // 'YYYY-MM-DD'
  weekend_sheet: boolean;    // auto-set if Sat/Sun
  created_at: string;
}
```

### `pdq_rooms` — `Room[]`
```ts
{
  id: string;
  sheet_id: string;
  name: string;
  sort_order: number;
  walls_data: { removed: boolean; floodCutLf: string; insulationSf: string } | null;
  ceiling_data: { removed: boolean; drywallSf: string; insulationSf: string } | null;
  flooring_data: { removed: boolean; selected: FlooringType[] } | null;
  measurements: { l: string; w: string; h: string; l2: string; w2: string } | null;
  created_at: string;
}
```

### `pdq_items` — `Item[]`
```ts
{
  id: string;
  room_id: string;
  scope_item_id: string;
  label: string;
  phase: string;             // '1' | '3' | 'general'
  subsection: string;
  child_sub: string | null;
  input_type: 'pct' | 'qty' | 'lf' | 'sf' | 'drop' | null;
  drop_options: string[] | null;
  no_hours: boolean;
  mandatory: boolean;
  has_note: boolean | null;
  sort_order: number;
  status: 'pending' | 'done' | 'not_needed';
  hours: number | null;
  hours_type: 'regular' | 'after';
  note: string | null;
  created_at: string;
}
```

---

## Scope Template (`constants/templates.ts`)

| Phase | Subsection | Key Items |
|---|---|---|
| 1 | Extraction | Weighted wand, wand extraction |
| 1 | Antimicrobial Application | Antimicrobial application |
| 1 | Contents Manipulation (Emergency) | Contents manipulation (drop: Small/Med/Large/XL) |
| 1 | Containment Chamber | Poly barrier, neg air machine, decon chamber, zip wall |
| 1 | Equipment / Stabilization | Dehumidifier, air scrubber, hydroxyl generator (Cat 3 mandatory) |
| 3 | Demolition | Drill holes, subfloor, flood cut, insulation, ceiling drywall, flooring |
| 3 | Cleaning | HEPA vacuum, antimicrobial wipe-down, fogging, air duct cleaning |
| 3 | Drying Equipment Setup | Air mover, dehumidifier check, moisture readings |
| 3 | Asbestos / Lead Testing | Asbestos sample, lead test |
| 3 | Trash / Debris Removal | Truck haul-out, dumpster, bag debris |
| general | General / Daily | PPE, equipment log, moisture readings, photo doc, safety walk |
| general | Electrician Required? | Ceiling fan, dishwasher circuit, microwave, disposal |
| general | Plumber Required? | Dishwasher, faucets/drain, toilet |

**Cat 3:** Hydroxyl Generator becomes mandatory + gets `— Cat 3` suffix.

**Room presets:** Living Room, Kitchen, Master Bedroom, Bedroom, Bathroom, Master Bathroom,
Hallway, Basement, Garage, Laundry Room, Dining Room, Office, Crawl Space, Attic.

---

## Key Business Rules

1. **One sheet per day** — blocked if sheet for today already exists
2. **Submit gate** — blocked if any item `pending` OR any `done` item requiring hours has `hours = null`
3. **Mandatory items** — cannot be `not_needed`; status cycle skips that state
4. **Cat 3 banner** — red warning when `water_category === 'cat3'`
5. **Section Yes/No** — No batch-sets all non-mandatory items in subsection to `not_needed`
6. **Weekend sheets** — if `date` is Sat/Sun, set `weekend_sheet: true`, default hours to `after`
7. **Room carry-forward** — when creating new sheet, copy rooms from previous sheet with items reset to `pending`
8. **General-only submit** — allow submit with no rooms if all general items are complete
9. **Auth bypass** — prototype mode, always redirect to `/(app)`

---

## Colors (`constants/colors.ts`)

```ts
PDQ_BLUE    = '#0077C8'
PDQ_GREEN   = '#3a9e3f'
PDQ_ORANGE  = '#FF6B00'
PDQ_RED     = '#d32f2f'
PDQ_GRAY    = '#6b7280'
PDQ_LIGHT   = '#f8fafc'
PDQ_DARK    = '#1e293b'
CAT3_BG     = '#fff0f0'
CAT3_BORDER = '#d32f2f'
```

---

## Features to Port From the Web Prototype

A parallel browser-based prototype (`PDQScopeTracker_v4.jsx`, ~4,900 lines) was built
in claude.ai. It contains tested business logic and UI behavior that needs to be
ported into this proper React Native codebase. Use it as the source of truth.

| Feature | Status | Notes |
|---|---|---|
| Login screen (2-letter codes: CB/JK/LT/DP) | ❌ Not built | See `LoginScreen` in prototype |
| KPI screen — closing ratio, avg job size, leaderboard | ❌ Not built | See `KPIScreen` in prototype |
| End-of-month contest banner ($1K / $500) | ❌ Not built | Bottom of `KPIScreen` in prototype |
| Weekend auto after-hours detection | ❌ Not built | `patchWeekend()` in prototype |
| Room carry-forward to next day | ❌ Not built | `createSheet` in prototype |
| General-only submit (no rooms required) | ❌ Not built | `canSubmit` logic in prototype |
| + Add Day (backdate missed sheets) | ❌ Not built | Sheet pill row in prototype `TechView` |
| Room measurements panel + IICRC S500 calculator | ❌ Not built | Top of `RoomSection` in prototype |
| Auto-fill qty from measurements | ❌ Not built | `applyMeasurements()` in prototype |
| 6-tab complete report | ❌ Not built | `buildCompleteReport()` in prototype |
| Xactimate billing format | ❌ Not built | Tab 6 of complete report in prototype |
| Photo required on specific items | ⚠️ Partial | `PhotoPicker.tsx` exists, logic incomplete |
| IICRC/OSHA popup reference cards | ❌ Not built | `IICRCPopup` in prototype |
| Hours input on item rows | ⚠️ Partial | Status cycles but no hours number input yet |
| Input type rendering (pct/qty/lf/sf/drop) | ⚠️ Partial | Stored but not rendered |

### Tech roster
```ts
{ code: "CB", name: "Chris B",  closingRatio: 74, avgJobSize: 11200 }
{ code: "JK", name: "Jerry K",  closingRatio: 70, avgJobSize: 10400 }
{ code: "LT", name: "Leo T",    closingRatio: 65, avgJobSize: 9100  }
{ code: "DP", name: "David P",  closingRatio: 62, avgJobSize: 8300  }
// Admin code: AD (Playbook / admin panel)
```

---

## Known Gaps / Current TODOs

- [ ] Photo picker expanded view in `RoomSection` — TODO comment in code
- [ ] PDF not wired to submit flow — `ReportBuilder.tsx` and `lib/pdf.ts` exist but not connected
- [ ] `lib/templates.ts` vs `constants/templates.ts` — overlap, needs consolidation
- [ ] Supabase auth active — connect when prototype is stable
- [ ] Estimator view (`estimator/[id].tsx`) — screen exists but content incomplete
- [ ] All features in the "Features to Port" table above

---

## Supabase Schema (when ready to connect)

```sql
projects  (id, job_name, address, job_type, water_category, status, created_by, created_at, updated_at)
sheets    (id, project_id, tech_name, hours_type, contents_status, contents_boxes, contents_hours, submitted, submitted_at, date, weekend_sheet, created_at)
rooms     (id, sheet_id, name, sort_order, walls_data, ceiling_data, flooring_data, measurements, created_at)
items     (id, room_id, scope_item_id, label, phase, subsection, child_sub, input_type, drop_options, no_hours, mandatory, status, hours, hours_type, note, sort_order, created_at)
photos    (id, project_id, sheet_id, room_id, item_id, storage_path, thumb_path, created_at)
techs     (id, name, code, closing_ratio, avg_job_size, active, created_at)
playbook  (id, key, value, updated_at)
```

---

## How to Work With Claude Code

**Add a scope item** → `constants/templates.ts` → `SCOPE_TEMPLATE` array

**Add a tech** → hardcode in login screen for now; future: `techs` table in Supabase

**Change a color** → `constants/colors.ts`

**Add a screen** → create file in `app/(app)/` following Expo Router v3 conventions, use TypeScript

**Port a feature from the web prototype** → find the relevant function/component in
`PDQScopeTracker_v4.jsx`, extract the business logic, translate to React Native
(View/Text instead of div/span, StyleSheet instead of inline style objects,
`lib/storage.ts` instead of localStorage direct calls)

**Connect Supabase** → remove bypass in `app/_layout.tsx`, replace localStorage
calls in `lib/storage.ts` with Supabase queries using the schema above
