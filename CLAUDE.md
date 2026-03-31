# CLAUDE.md — PDQ Scope Tracker

This file is the implementation guide for porting all features from the browser prototype
(`PDQScopeTracker_v4.jsx`) into this React Native / Expo / TypeScript codebase.

Read this file before making any changes. Every feature, business rule, data shape, and
UI behavior is documented here so nothing gets missed.

---

## Two Codebases — One Product

| Codebase | What it is | Status |
|---|---|---|
| `PDQScopeTracker_v4.jsx` | Browser prototype — single JSX file, React 18 CDN, localStorage | ✅ Feature-complete, tested in field |
| This repo | React Native + Expo + TypeScript + Supabase | 🔄 Being built — use JSX as source of truth |

**The JSX prototype is the source of truth for all business logic and UI behavior.**
When building any feature here, find the equivalent code in the JSX file and port it.
Translate `div` → `View`, `span` → `Text`, inline styles → `StyleSheet`, localStorage → `lib/storage.ts`.

---

## Infrastructure

| Layer | Service | Details |
|---|---|---|
| Framework | Expo SDK 51 + React Native 0.74.5 | Expo Router v3 file-based routing |
| Language | TypeScript | Strict mode |
| Hosting | Cloudflare Pages | `wrangler deploy` |
| Database | Supabase | Project exists — auth bypassed in prototype mode |
| Storage | localStorage (prototype) | Will migrate to Supabase |
| PDF | expo-print | `lib/pdf.ts` + `components/report/ReportBuilder.tsx` |
| Photos | expo-image-picker | `hooks/usePhotos.ts` + `components/ui/PhotoPicker.tsx` |
| Bundle ID | `com.pdqrestoration.scopetracker` | |

---

## How to Run

```bash
npm install
npm run web          # dev server
npm run deploy       # deploy to Cloudflare
```

`.env.local` (never commit):
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Repo File Structure

```
pdq-scope-tracker/
├── app/
│   ├── _layout.tsx                   # Root — auth bypass active, redirects to /(app)
│   ├── (auth)/login.tsx              # Login screen (redirect only in prototype)
│   └── (app)/
│       ├── _layout.tsx
│       ├── index.tsx                 # Home — project list + New Project modal
│       └── project/
│           ├── [id].tsx              # Project detail — sheet list
│           ├── tech/[id].tsx         # Tech sheet — checklist entry
│           └── estimator/[id].tsx    # Estimator view (incomplete)
├── components/
│   ├── cards/ProjectCard.tsx
│   ├── report/ReportBuilder.tsx
│   ├── scope/
│   │   ├── RoomSection.tsx
│   │   ├── ContentsSection.tsx
│   │   ├── WallsCeilingUI.tsx
│   │   ├── FlooringSection.tsx
│   │   └── AsbestosSection.tsx
│   └── ui/
│       ├── Badge.tsx
│       ├── Button.tsx
│       └── PhotoPicker.tsx
├── constants/
│   ├── colors.ts                     # PDQ brand colors
│   └── templates.ts                  # SCOPE_TEMPLATE, ROOM_PRESETS, makeRoomItems()
├── context/AppContext.tsx             # Supabase auth (bypassed)
├── hooks/
│   ├── useProject.ts
│   ├── useSheet.ts
│   └── usePhotos.ts
├── lib/
│   ├── storage.ts                    # localStorage CRUD
│   ├── supabase.ts                   # Supabase client
│   ├── templates.ts                  # May overlap constants/templates.ts — consolidate
│   ├── photos.ts
│   └── pdf.ts
├── supabase/                         # Migrations
├── app.json
├── wrangler.jsonc
└── CLAUDE.md                         # This file
```

---

## App Flow (from JSX prototype)

```
Login Screen
  → type 2-letter code (CB / JK / LT / DP)
  → or tap name card

KPI Screen
  → Both KPI cards always visible at top (tap to expand each)
  → Closing Ratio card — tappable, shows team leaderboard + motivational callout
  → Avg Job Size card — tappable, shows team comparison
  → End-of-month contest banner ($1,000 / $500 prizes)
  → Personalized gap callouts by rank
  → ← Switch button to go back to login
  → "Let's Go — Open Dashboard →" button

Home / Dashboard
  → Active jobs list
  → Completed jobs list
  → + New Project button
  → Each job card: [Tap to open →] [📊 Estimator Review] [✓ Mark Complete] [🗑]
  → Completed jobs show [📦 View Report] instead of Mark Complete

Tech View (daily sheet)
  → Date pill tabs across top — tap to switch between days
  → + Add Day button in pill row (opens inline date picker for backdating)
  → Weekend banner (📅 orange) when sheet date is Sat/Sun
  → Cat 3 red banner when job is Category 3
  → Tech name input
  → Additional Techs Yes/No (⚠ MUST ANSWER — blocks submit until answered)
  → Contents question (Yes/No/Not Sure)
  → General — Daily section (PINNED, collapsible):
      - Full PPE — Respirators & Tyvek Suits (qty input)
      - Monitor & record moisture readings (📷 photo REQUIRED, Yes/No buttons)
      - Clean up work area end of day (📷 photo REQUIRED, Yes/No buttons)
      - Daily notes textarea
      - Tappable "X left ▾" badge — expands section, scrolls to first pending item
  → Rooms (carried forward from previous day automatically)
  → + Add Room button
  → Summary bar: ✓ done · — N/A · ○ X left ▾ · X rooms
  → Submit Today's Scope Sheet button
  → Hint text: "Complete General — Daily or add a room to unlock"

Estimator View
  → Project summary stats (days/rooms/tasks/photos)
  → Flooring removed summary
  → Completed work by room
  → Daily breakdown (expandable day cards)
  → 📦 View Reports button → opens 6-tab complete report

Complete Report (6 tabs)
  → 📊 Summary — stat cards, loss table, personnel hours, phases completed
  → 📋 Daily Log — day cards with techs, rooms, items, notes
  → 💰 Billing — room-by-room Xactimate line items, general section, grand total
  → 👷 Tech Hours — reg/after/total hours per tech, labor table
  → 🔧 Equipment — unit-days, dates deployed per equipment type
  → 📄 Xactimate — PDQ billing format matching Santoli_Billing_Package layout
```

---

## Tech Roster

```ts
// JSX source: TECHS array (Section 7)
// Login codes are 2-letter initials

const TECHS = [
  { id: "CB", name: "Chris B",  code: "CB", closingRatio: 74, avgJobSize: 11200 },
  { id: "JK", name: "Jerry K",  code: "JK", closingRatio: 70, avgJobSize: 10400 },
  { id: "LT", name: "Leo T",    code: "LT", closingRatio: 65, avgJobSize: 9100  },
  { id: "DP", name: "David P",  code: "DP", closingRatio: 62, avgJobSize: 8300  },
];
// Admin code: AD (Playbook panel)
```

---

## Data Model

All data currently lives in localStorage in the JSX prototype.
Field names below match the JSX prototype exactly — use these when building Supabase tables.

### Project
```ts
{
  id: string                        // uid()
  jobName: string
  address: string
  jobType: string                   // "Water Mitigation" | "Fire / Smoke Restoration" | "Reconstruction"
  waterCategory: "cat2" | "cat3" | null
  status: "active" | "complete"
  createdAt: string                 // ISO
}
```

### Sheet
```ts
{
  id: string
  date: string                      // "YYYY-MM-DD"
  techName: string
  additionalTechs: string[]
  additionalTechsAnswered: boolean  // must answer Yes/No before submit
  submitted: boolean
  submittedAt: string | null
  weekendSheet: boolean             // auto-set if date is Sat/Sun
  contents: {
    needed: boolean | null          // Yes/No/null
    boxes: string
    hours: string
  }
  general: {
    items: Item[]                   // PPE, moisture readings, clean up
    notes: string
  }
  rooms: Room[]
}
```

### Room
```ts
{
  id: string
  name: string
  items: Item[]
  subYesNo: { [subsectionKey]: boolean }
  measurements: { l: string, w: string, h: string, l2: string, w2: string }
  flooring: { removed: boolean | null, types: string[], items: FlooringItem[] }
  walls:    { removed: boolean | null, items: Item[] }
  ceiling:  { removed: boolean | null, items: Item[] }
  asbestos: { required: boolean | null, items: Item[] }
  mold:     { required: boolean | null, items: Item[] }
}
```

### Item
```ts
{
  id: string
  label: string
  status: "pending" | "done" | "not_needed"
  hours: "regular" | "after" | ""
  notes: string
  phase: string
  subsection: string
  childSub: string
  inputType: "qty" | "pct" | "lf" | "dropdown" | "sentinel" | null
  qty: string
  pct: string
  dropVal: string
  dropOptions: string[]
  noHours: boolean                  // equipment — no hours required
  mandatory: boolean                // cannot be not_needed
  forceHeader: boolean
  hasNote: boolean
}
```

### localStorage Keys
```
pdq-scope-projects              → Project[]
pdq-sheets-{projectId}         → Sheet[]
pdq-photos-{projectId}-{sheetId} → { [itemId]: Photo[] }
pdq-playbook                    → PlaybookSettings (admin panel)
```

---

## Scope Templates (JSX Section 3)

### Water Mitigation phases — `SCOPE_TEMPLATES_SECTIONED`

| Phase | Subsection | Input Type | Key Items |
|---|---|---|---|
| Phase 1 — Emergency Services | Extraction | pct | Weighted wand extraction, Wand extraction |
| Phase 1 — Emergency Services | Antimicrobial Application | pct | Antimicrobial application |
| Phase 1 — Emergency Services | Contents Manipulation (Emergency) | dropdown | Small / Medium / Large / X-Large |
| Phase 1 — Emergency Services | Containment Chamber | qty/lf | Plastic SF, poles, zippers, masking LF, furniture |
| Phase 1 — Emergency Services | Equipment / Stabilization | qty, noHours | Air movers, Dehumidifier, Drainage container, Air scrubber, Hydroxyl Generator (Cat 3 mandatory) |
| Phase 1 — Emergency Services | Testing | sentinel | Asbestos/Lead → Yes/No UI |
| Phase 1.5 — Mold Protocol | Mold | sentinel | Mold → Yes/No UI |
| Phase 3 — Demo, Cleaning, Dryout | Demolition | — | Weep holes, subfloor |
| Phase 3 | Demolition → Walls | sentinel | Walls demo UI |
| Phase 3 | Demolition → Ceiling | sentinel | Ceiling demo UI |
| Phase 3 | Demolition → Flooring | sentinel | Flooring chip selector |
| Phase 3 | Cleaning | — | Studs, joists, floor, HEPA, antimicrobial wipe |
| Phase 3 | Drying Equipment Setup | qty, noHours | Air movers, dehumidifiers, readings |
| General | Electrician Required? | — | Ceiling fan, dishwasher, microwave, disposal |
| General | Plumber Required? | — | Dishwasher, faucets, toilet |
| General | Trash / Debris Removal | qty, noHours | Truck load, dumpster, bag debris |

### General / Daily (pinned top of every sheet)
```
Full PPE — Respirators & Tyvek Suits   [qty, noHours, photo NOT required]
Monitor & record moisture readings      [noHours, YES/NO BUTTONS, 📷 PHOTO REQUIRED]
Clean up work area end of day          [noHours, YES/NO BUTTONS, 📷 PHOTO REQUIRED]
Daily notes                            [free text]
```

### Sentinel items
Sentinels (`__asbestos_sentinel__`, `__mold_sentinel__`, `__walls_sentinel__`, `__ceiling_sentinel__`, `__flooring_sentinel__`) are special placeholders that render dedicated UI components instead of normal item rows. They never get `— Cat 3` appended to their labels.

---

## Business Rules — Port All of These Exactly

### Submit Gate
Sheet cannot be submitted until ALL of:
1. All items are `done` or `not_needed` (none `pending`)
2. All `done` items that require hours have `hours` set to `"regular"` or `"after"`
3. Tech name entered
4. `additionalTechsAnswered` is `true` or `false`
5. Contents question answered (`needed !== null`)
6. **Exception:** If no rooms added but all general items complete → allow submit

### Cat 2 / Cat 3
- Required at project creation for Water Mitigation
- Cat 3: all item labels get `" — Cat 3"` appended (except sentinel items)
- Hydroxyl Generator becomes mandatory (cannot be N/A), mandatory badge shown
- Red `☣️ Cat 3 — Black Water Job — Enhanced PPE required` banner in TechView
- Sentinel items NEVER get Cat 3 suffix — check with `i.inputType === "sentinel"`

### Weekend Auto After-Hours
- When `createSheet` is called, check `new Date(date + "T12:00:00").getDay()`
- If day === 0 (Sun) or day === 6 (Sat) → set `weekendSheet: true` on the sheet
- Same check when opening any existing sheet (`patchWeekend` function)
- Orange banner: `📅 Weekend — After Hours Day` shown in TechView
- When tech marks item Done on weekend sheet → auto-set `hours: "after"` if no hours chosen

### Room Carry-Forward
- When creating a new sheet (`createSheet`), find most recent previous submitted sheet
- Copy all rooms from that sheet with:
  - Fresh `id` (uid())
  - All `items` reset to `status: "pending"`, `hours: ""`, `notes: ""`
  - Equipment items keep their `qty` (noHours items)
  - `subYesNo` reset to `{}`
  - `asbestos` reset to `{ required: null, items: [] }` (re-test each day)
  - `mold`, `flooring`, `walls`, `ceiling` items reset to pending
- Flash message: "X rooms carried forward from previous day"

### Add Day (Backdate)
- `+ Add Day` button in sheet pill row (always visible when on an active job)
- Tapping shows inline date picker (type="date", max=today)
- `Go` button creates sheet for that date
- Block if sheet already exists for that date

### Mandatory Items
- Items with `mandatory: true` cannot be set to `not_needed`
- Status toggle skips `not_needed` state
- Shown with red `MANDATORY` badge

### Section Yes/No Headers
- Every subsection has Yes / No buttons in its header
- **No** → batch-marks all items `not_needed`, collapses section
- **Yes** → expands section, resets `not_needed` → `pending`
- Asbestos and Mold use sentinel pattern with dedicated Yes/No UI components

### Additional Techs
- Yes/No question required before submit
- **⚠ MUST ANSWER** amber badge until answered
- Yes → name entry required
- No → "✓ Only lead tech on site today"

### Photo Requirements
- **Monitor & record moisture readings** → photo required + Yes/No buttons, Done blocked until photo added
- **Clean up work area end of day** → same
- **Asbestos test items** → photo required before Done
- `📷 Add Photo — Required` button shown in red
- `⚠ Photo required before completing` warning text below

### Tappable Badges
- Summary bar `○ X left ▾` → scrolls to first pending room item, or expands General if only general pending
- Room header `X left ▾` → expands room
- Phase header `X left ▾` → expands phase, scrolls to first pending item
- General `X left ▾` → expands General section, scrolls to first pending item

### Room Measurements Panel
Every room has a collapsible `📐 Room Measurements` panel at top when expanded:
- Inputs: Length × Width × Height (default 8ft) + optional Alcove L × W
- Calculates: Floor SF (`L×W + alcove`), Wall SF (`perimeter × H`), Perimeter LF
- **IICRC S500 Equipment Calculator:**
  - Air movers: Cat 2 = 1 per 55 SF floor + 1 per 10 LF affected walls (50% of perimeter), min 3
  - Cat 3: 1 per 35 SF floor + wall movers
  - Dehumidifiers: 1 LGR per 6 air movers, min 1
- Shows two result cards: `💨 Air Movers` and `💧 Dehumidifiers` with breakdown
- **Apply to Scope Items** button → auto-fills qty on matching items:
  - Floor/carpet/tile/vinyl/hardwood/extraction/antimicrobial/HEPA/cleaning → Floor SF
  - Drywall/insulation/flood cut/baseboard → Wall SF
  - Ceiling items → Floor SF (same as ceiling SF)
  - Air movers → IICRC calculated count
  - Dehumidifiers → IICRC calculated count

### General Section (non-room)
- Rendered OUTSIDE rooms, above room list, pinned at top
- Electrician Required? / Plumber Required? / Trash/Debris Removal
- These are NOT rendered inside room phase loops (`if (ph === "General") return;`)

---

## KPI Screen — Full Implementation

```
Both KPI cards always at top (side by side):
  [Closing Ratio]         [Avg Job Size]
  44px number             32px dollar amount
  Progress bar at top     Solid green bar
  "tap to expand ▾"       "tap to expand ▾"

Tap Closing Ratio → expands below:
  Motivational callout (color-coded by rank):
    Rank 1 (orange): "🔥 You're the closer on this team. Stay hungry..."
    Rank 2 (blue):   "💪 You're X% behind [name]. One more close..."
    Rank 3 (blue):   "📈 Push past [name] — only X% behind #2..."
    Rank 4 (red):    "🚀 You're at the bottom right now. Every job is a chance..."
  Team Standing bars (all 4 techs with progress bars)
  Gap callouts: "X% behind #N · Y% ahead of #N"

Tap Avg Job Size → expands below:
  Motivational callout by job size rank
  Team comparison bars with dollar amounts

Always visible at bottom:
  END OF MONTH CONTEST banner:
    🏆 END OF MONTH CONTEST — Closing Ratio Challenge
    🥇 1st Place → $1,000 cash (gold gradient card)
    🥈 2nd Place → $500 cash (silver card)
    Personalized callout by rank:
      Rank 1: "🔥 You're in 1st — the $1,000 is yours to lose · X days left"
      Rank 2: "💰 You're X% behind $1,000 — $500 is yours now"
      Rank 3/4: "⚡ X% behind $500 · Y% behind $1,000 · every job counts"
    Days left = auto-calculated from today to last day of month

  "Let's Go — Open Dashboard →" button

Header:
  Tech avatar (orange circle) + "Hey, [name]!" + rank emoji
  ← Switch button → goes back to login screen
```

---

## Complete Report (`buildCompleteReport`) — Port to `lib/pdf.ts`

The report is generated as an HTML string then shown in an iframe.
All helper functions must be **defined inline** — no external references.

```ts
// Required inline helpers (must NOT reference anything outside the function)
const fmt$ = (n) => "$" + Number(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}) : "—";
const fmtDateShort = (d) => d ? new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—";

// Xactimate NE Region prices (inline in function)
const XPC = {
  "extraction": 0.38, "antimicrobial": 0.41, "dehumidifier": 75.75,
  "air mover": 32.50, "air scrubber": 79.00, "hydroxyl": 125.00,
  "drywall": 1.41, "carpet pad": 0.22, "carpet": 0.45, "tile": 2.45,
  "vinyl": 0.68, "hardwood": 1.95, "baseboard": 0.85, "insulation": 1.03,
  "stud": 1.27, "hepa": 0.51, "mold remediation": 8.50, "encapsulant": 1.85,
  "asbestos": 385.00, "monitoring": 55.00, "moisture": 75.00
};
const getPrice = (label) => {
  const l = (label||"").toLowerCase();
  for (const [k,v] of Object.entries(XPC)) { if (l.includes(k)) return v; }
  return 0;
};
```

### Tab structure
| Tab ID | Tab Label | Contents |
|---|---|---|
| t1 | 📊 Summary | Stat cards (days/rooms/tasks/photos), loss table, personnel summary, phases completed |
| t2 | 📋 Daily Log | Day cards with tech names, room tags, all done items, hours type, daily notes |
| t3 | 💰 Billing | Room-by-room tables with phase headers, Xactimate prices, general section, grand total |
| t4 | 👷 Tech Hours | Tech cards (reg/after/total), labor summary table |
| t5 | 🔧 Equipment | Equipment cards with unit-days and dates, equipment dates table |
| t6 | 📄 Xactimate | PDQ Xactimate-format pages — logo, numbered items, italic IICRC notes, per-room pages, general page, grand total, tech names on every page footer |

### Tab switching JS (critical for iOS)
```js
// Use event.currentTarget — NEVER 'this' inside iframe on iOS
function showTab(id, ev) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  (ev.currentTarget || ev.target).classList.add('active');
}
// Call with: onclick="showTab('t1', event)"
```

---

## IICRC Reference Popups

7 definitions in the `IICRC_DEFS` object. Each has `title`, `icon`, `rules[]`, `source`.

| Key | Icon | Trigger |
|---|---|---|
| "Air movers" | 💨 | Tap ⓘ on air mover items |
| "Dehumidifier (per 24 hr period)" | 💧 | Tap ⓘ on dehumidifier items |
| "Air scrubber — Large (per 24 hr period)" | 🌀 | Tap ⓘ on air scrubber items |
| "Hydroxyl Generator — REQUIRED for Cat 3" | ☣️ | Tap ⓘ on hydroxyl items |
| "Antimicrobial Application" | 🧪 | Tap ⓘ on antimicrobial items |
| "Asbestos / Lead Testing" | ⚠️ | Auto-opens when tech taps Yes on asbestos sentinel |
| "Mold Protocol" | 🦠 | Tap warning text in mold section |

---

## Brand Colors

```ts
// JSX source: BRAND object (Section 1)
// RN equivalent: constants/colors.ts

blue:       "#0077C8"
blueDark:   "#005fa3"
blueDeep:   "#003f6e"
green:      "#3a9e3f"
greenDark:  "#2a7530"
orange:     "#FF6B00"
orangeDark: "#cc5500"
navy:       "#0a1628"   // page background
navyCard:   "#0f1f38"   // card background
navyBorder: "#1a3050"   // borders
navyLight:  "#1c3354"
```

---

## iOS / Mobile Rules (Critical)

These rules caused bugs in the prototype — follow them exactly in React Native:

- **NEVER use `onTouchEnd`** — always `onClick` / `onPress` only
- **`touch-action: manipulation`** on all buttons (prevents 300ms tap delay)
- **`-webkit-tap-highlight-color: transparent`** on all buttons
- **Tab switching in iframes**: use `event.currentTarget`, NEVER `this`
- **PDF on iPhone**: browser print dialog → pinch-zoom preview → Share ⬆ → Save to Files

---

## Playbook (Admin Panel)

Separate file: `PDQPlaybook.jsx` / `playbook.html` in the browser prototype.
Access: `/playbook.html` — login code `AD`

Saves settings to `pdq-playbook` localStorage key.
Main app does NOT yet read from this key — needs to be wired.

| Tab | Controls |
|---|---|
| 👷 Techs | Add/edit/remove techs, update KPI numbers |
| 🏠 Rooms | Toggle rooms on/off, add custom rooms |
| 📋 Phases | Edit workflow phases, subsections, items, photo requirements |
| 💰 Prices | Edit Xactimate unit prices |
| 🏆 Contest | Set prize amounts, end date, toggle contest on/off |

---

## Supabase Schema (when ready to connect)

```sql
projects  (id, job_name, address, job_type, water_category, status, created_at)
sheets    (id, project_id, date, tech_name, additional_techs, additional_techs_answered,
           submitted, submitted_at, weekend_sheet, contents_needed, contents_boxes,
           contents_hours, general_notes, created_at)
rooms     (id, sheet_id, name, sort_order, sub_yes_no, measurements,
           flooring_removed, flooring_types, walls_removed, ceiling_removed,
           asbestos_required, mold_required, created_at)
items     (id, room_id, label, status, hours, notes, phase, subsection, child_sub,
           input_type, qty, pct, drop_val, no_hours, mandatory, sort_order, created_at)
photos    (id, project_id, sheet_id, item_id, data_url, thumb_url, created_at)
techs     (id, name, code, closing_ratio, avg_job_size, active, created_at)
playbook  (id, key, value, updated_at)
```

---

## Feature Port Status

| Feature | JSX Section | RN Status |
|---|---|---|
| Login screen (CB/JK/LT/DP) | Section 8 `LoginScreen` | ❌ Not built |
| KPI screen + leaderboard | Section 9 `KPIScreen` | ❌ Not built |
| Contest banner ($1K/$500) | Section 9 bottom | ❌ Not built |
| Brand colors | Section 1 `BRAND` | ⚠️ Partial (`constants/colors.ts`) |
| IICRC popup definitions | Section 2 `IICRC_DEFS` | ❌ Not built |
| Scope templates | Section 3 `SCOPE_TEMPLATES_SECTIONED` | ⚠️ Partial (`constants/templates.ts`) |
| Storage helpers | Section 4 `sGet/sSet` | ⚠️ Partial (`lib/storage.ts`) |
| Tech roster | Section 7 `TECHS` | ❌ Not built (hardcode for now) |
| New Project form | Section 11 `NewProjectForm` | ⚠️ Partial (`app/(app)/index.tsx`) |
| Root state + view routing | Section 12 | ⚠️ Partial |
| Build complete report | Section 12c `buildCompleteReport` | ❌ Not built (`lib/pdf.ts` stub) |
| Weekend auto after-hours | Section 12d `patchWeekend` | ❌ Not built |
| Room carry-forward | Section 12d `createSheet` | ❌ Not built |
| Mark complete + report modal | Section 12d `markComplete` | ❌ Not built |
| IICRC popup component | Section 13 `IICRCPopup` | ❌ Not built |
| Project card | Section 14 `PCard` | ⚠️ Partial (`components/cards/ProjectCard.tsx`) |
| Tech view — full daily sheet | Section 15 `TechView` | ⚠️ Partial (`app/(app)/project/tech/[id].tsx`) |
| General — daily pinned section | Section 15 | ❌ Not built |
| + Add Day button | Section 15 | ❌ Not built |
| Summary bar with tappable badges | Section 15 | ❌ Not built |
| Walls & ceiling UI | Section 16 `WallsCeilingUI` | ⚠️ Partial (`components/scope/WallsCeilingUI.tsx`) |
| Room section accordion | Section 17 `RoomSection` | ⚠️ Partial (`components/scope/RoomSection.tsx`) |
| Room measurements panel | Section 17 | ❌ Not built |
| IICRC S500 equipment calculator | Section 17 | ❌ Not built |
| Asbestos Yes/No sentinel UI | Section 17 | ❌ Not built |
| Mold Protocol sentinel UI | Section 17 | ❌ Not built |
| Flooring chip selector | Section 17 | ⚠️ Partial (`components/scope/FlooringSection.tsx`) |
| Photo required items | Section 15 + 17 | ❌ Not built |
| Estimator view | Section 19 `EstView` | ❌ Incomplete (`app/(app)/project/estimator/[id].tsx`) |
| View Reports button | Section 19 | ❌ Not built |
| Generate Bill (Xactimate) | Section 19 `buildBill` | ❌ Not built |
| Storage debug panel | Section 18 `StorageDebug` | Low priority |
| Playbook admin panel | `PDQPlaybook.jsx` | ❌ Not built in RN |

---

## How to Work With Claude Code

**Find a feature:** Search JSX file by section number (e.g. `SECTION 15`)

**Port a component:** Find in JSX → extract logic → translate to RN:
- `div` → `View`, `span` → `Text`, `button` → `TouchableOpacity`/`Pressable`
- `style={{ }}` → `StyleSheet.create({})`
- `localStorage` → `lib/storage.ts`
- `useState` hook → same in RN
- `onClick` → `onPress`

**Add a scope item:** `constants/templates.ts` → `SCOPE_TEMPLATE` array

**Change a color:** `constants/colors.ts`

**Add a screen:** `app/(app)/[name].tsx` following Expo Router v3 conventions

**Connect Supabase:** Remove bypass in `app/_layout.tsx`, replace storage calls in `lib/storage.ts`
