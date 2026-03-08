# My Advocate – Case Management System

## Current State

The app has a complete auth, registration, profile setup, and dashboard system. Advocates have a "My Cases" screen and a "My Clients" screen. Clients have a "My Cases" screen. Both currently navigate to placeholder pages. All data is stored in localStorage with structured data models (users, profiles, advocate data, client data). Screens are managed via a `Screen` union type in App.tsx.

Existing localStorage keys:
- `myadvocate_users` – StoredUser[]
- `myadvocate_profiles` – StoredProfile[]
- `myadvocate_advocate_data` – AdvocateData[]
- `myadvocate_client_data` – ClientData[] (has `linkedAdvocateId` = advocate's referral code)

Existing constants: `PRACTICE_AREAS` array (9 options: Criminal Law, Civil Law, Family Law, Corporate Law, Property Law, Tax Law, Constitutional Law, Labour Law, Other).

## Requested Changes (Diff)

### Add

**Case data model** (localStorage key: `myadvocate_cases`):
```
interface StoredCase {
  id: string;                  // unique uuid
  advocateId: string;          // advocate's mobile (userId)
  clientId: string;            // client's mobile (userId)
  caseTitle: string;
  caseNumber: string;
  courtName: string;
  caseType: string;            // one of PRACTICE_AREAS
  caseStatus: "Active" | "Pending" | "Adjourned" | "Closed" | "Disposed";
  nextHearingDate: string;     // ISO date string (YYYY-MM-DD) or ""
  notes: string;
  createdAt: string;           // ISO timestamp
}
```

**Case CRUD helpers** (localStorage-based):
- `loadCases()`, `saveCases()`, `addCase()`, `updateCase()`, `deleteCase()`
- `getCasesForAdvocateClient(advocateId, clientId)` – cases for a specific client under an advocate
- `getCasesForClient(clientId)` – all cases where clientId matches (for client view, filtered to their connected advocate only)
- `getUpcomingHearings(advocateId)` – all future hearing cases across all clients for an advocate, sorted by date

**New Screen types** added to `Screen` union:
- `"case-form"` – add/edit case modal/page (advocate only)
- `"hearings"` – dedicated Hearings page (advocate only)

**MyCasesPage** (advocate view):
- When advocate opens "My Cases": show their clients list, each client showing a count of their cases
- Clicking a client opens that client's case list within the advocate's context
- Cases shown as cards with filter (Case Status, Hearing Date range, Court Name) and sort (Next Hearing Date, Recently Added)
- Each case card shows: Case Title, Case Number, Court Name, Case Type badge, Case Status badge, Next Hearing Date, truncated Notes
- Add Case button at top → opens Add Case form
- Each card has Edit and Delete buttons (advocate only)
- Status badge colors: Active=green, Pending=yellow, Adjourned=orange, Closed=gray, Disposed=red

**MyCasesPage** (client view):
- Shows all cases linked to the client via their connected advocate
- Read-only cards (no Add/Edit/Delete buttons)
- Same card design, filter, and sort as advocate view
- If client has no connected advocate, show empty state: "Connect with an advocate to view your cases."

**Client Profile Page extension** (advocate viewing a client):
- Add "Cases" section at the bottom of the existing ClientProfilePage
- Shows that client's cases list (advocate can add/edit/delete)
- Same card style with Add Case button

**Add/Edit Case Form** (Sheet or Dialog, advocate only):
Fields:
- Case Title (text, required)
- Case Number (text, required)
- Court Name (text, required)
- Case Type (dropdown, PRACTICE_AREAS, required)
- Case Status (dropdown: Active/Pending/Adjourned/Closed/Disposed, required)
- Next Hearing Date (date input, optional)
- Notes (textarea, optional)

**Upcoming Hearings section on Dashboard**:
- Advocate dashboard: add "Upcoming Hearings" section below the 4 cards
- Shows next 3–5 upcoming hearings across all clients
- Each hearing chip shows: client name, case title, court, date
- Date highlights: "Today" (red/urgent), "Tomorrow" (orange), "Next 7 days" (blue), further = gray
- "View All" link navigates to `"hearings"` screen

**Hearings Page** (dedicated, advocate only):
- Full list of all future hearings for all the advocate's clients
- Grouped or sorted by date
- Same highlight logic: Today, Tomorrow, Next 7 days, Beyond
- Each card: client name, case title, court name, case number, date label
- Back to Dashboard button in header

### Modify

- `MyCasesPage`: replace placeholder content with full case management UI
- `ClientProfilePage`: add Cases section at bottom
- `DashboardScreen` (advocate view): add Upcoming Hearings section below navigation cards
- `Screen` type union: add `"case-form"` and `"hearings"`
- App root: wire `"hearings"` screen to new HearingsPage component

### Remove

- Placeholder text in MyCasesPage ("Your case management system will appear here")

## Implementation Plan

1. Add `StoredCase` interface and all CRUD helpers to App.tsx
2. Add `"hearings"` to the Screen union type
3. Replace `MyCasesPage` with full advocate case management (client selector → case list with filters/sort → add/edit/delete via Sheet form)
4. Replace `MyCasesPage` client view with read-only filtered case list
5. Add Cases section to `ClientProfilePage` (advocate view of a client)
6. Add `AddEditCaseSheet` component (Sheet-based form, advocate only)
7. Add Upcoming Hearings section to `DashboardScreen` (advocate only), showing 3–5 next hearings
8. Build `HearingsPage` with full future hearing list, date grouping and highlight logic
9. Wire `"hearings"` screen in App root
10. Apply all `data-ocid` deterministic markers to new interactive surfaces
