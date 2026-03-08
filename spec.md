# My Advocate

## Current State
The app has a full auth flow (splash, login, OTP, signup, profile setup), dashboards for advocates and clients, case management, document management, a messaging system, hearings list, and a hearing calendar. The Screen union and routing are all in a single App.tsx (~9600 lines). Data lives in localStorage. The existing `advocate-public-profile` screen lets a client view one advocate's profile after navigating from their own "My Profile" page (via the connected-advocate card).

## Requested Changes (Diff)

### Add
- New `Screen` values: `"find-advocates"` and `"advocate-discovery-profile"`
- `SAMPLE_ADVOCATES` constant: 5 dummy advocate profiles pre-seeded into localStorage on first load (stored as `StoredProfile` + `AdvocateData` entries) so the directory is never empty
- `FindAdvocatesPage` component:
  - Accessible to both clients and advocates (advocates use it for networking)
  - Search bar (text input, filters by name)
  - Filter dropdowns: Practice Area, City (free text), Court (free text), Experience Range (0–5 yrs / 5–10 yrs / 10+ yrs)
  - Advocate cards grid showing: profile photo/initials avatar, name, practice area badge, city, experience
  - "Connected" badge on cards where the current client is already linked to that advocate
  - Clicking a card navigates to `advocate-discovery-profile`
  - Empty state when no results match
- `AdvocateDiscoveryProfilePage` component (read-only, full profile):
  - Cover photo / gradient, avatar straddling boundary
  - Full name, practice area, court, experience, state/city, bio, bar council number
  - If current user is a **client** and NOT yet connected → show two connect options:
    - "Connect" button (auto-connects in demo mode: sets `linkedAdvocateId`)
    - "Enter Referral Code" collapsible input
  - If current user is a **client** and IS already connected → show "Connected" badge only (no connect buttons)
  - If current user is an **advocate** → show a "Network" badge, no connect button
  - Back button returns to `find-advocates`
- "Find Advocates" card on **both** advocate and client dashboards (new card added to both `advocateCards` and `clientCards` arrays)

### Modify
- `Screen` type union: add `"find-advocates"` and `"advocate-discovery-profile"`
- `DashboardScreen`: add "Find Advocates" card to both `advocateCards` and `clientCards`
- `App` root: add routing cases for `find-advocates` and `advocate-discovery-profile`
- Add `selectedDiscoveryAdvocateId` state variable in App root
- Seed sample advocate data on app first load (localStorage check)

### Remove
- Nothing removed

## Implementation Plan
1. Add `"find-advocates"` and `"advocate-discovery-profile"` to the `Screen` type
2. Define `SAMPLE_ADVOCATES` array (5 entries) and a `seedSampleAdvocates()` function that inserts them on first load (guarded by a localStorage key)
3. Call `seedSampleAdvocates()` inside the App component on mount
4. Build `FindAdvocatesPage`: search bar + 4 filter dropdowns, advocate card grid, Connected badge logic, empty state
5. Build `AdvocateDiscoveryProfilePage`: full read-only profile, client connect button (auto-accept), referral code input, advocate networking view
6. Add "Find Advocates" card to both dashboard card arrays
7. Add `selectedDiscoveryAdvocateId` state + routing in App root for the two new screens
8. Wire back-navigation: `find-advocates` → back to dashboard; `advocate-discovery-profile` → back to `find-advocates`
