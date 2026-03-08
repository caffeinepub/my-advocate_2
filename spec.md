# My Advocate

## Current State
The app is a full-stack legal networking platform with the following working features:
- Splash screen, Login (password + OTP), Forgot Password
- Role selection (Advocate / Client), Registration forms with OTP verification
- Profile setup (mandatory, with photo crop)
- Dashboard (grid of icon cards — currently cleared/blank in v23)
- My Profile, My Cases, Hearings, Calendar, My Clients, Messages/Chat, Find Advocates, Legal Feed pages
- All data stored in localStorage (demo mode)
- All existing pages are rendered via a `Screen` union type + conditional rendering in App.tsx

## Requested Changes (Diff)

### Add
- **Top Header** (persistent, shown after login): hamburger menu icon (left), My Advocate logo/wordmark (center), search icon + notification bell icon (right). Header replaces the old per-page headers inside dashboard screens.
- **Bottom Navigation Bar** (persistent, shown after login): role-specific tabs.
  - Advocate: Home | Cases | Clients | Messages | Profile
  - Client: Home | Cases | Messages | Find Advocates | Profile
  - Each tab has an icon + label, active tab highlighted in primary blue.
- **Side Drawer** (slides in from left on hamburger tap, dark backdrop overlay): contains menu items: My Profile, Hearing Calendar, Documents, Case Statistics, Notifications, Settings, Help, Logout. Shows user avatar + name at top.
- `AppShell` wrapper component that composes TopHeader + BottomNav + SideDrawer around child content. Only shown when user is logged in and has completed profile setup.

### Modify
- The `dashboard` screen state becomes the entry point after login. It now renders the `AppShell` with the active tab content instead of a grid.
- The `Screen` type is extended to include `"shell"` as the root authenticated state (or the `dashboard` screen transitions into the shell).
- All existing page components remain unchanged for now — they will be wired into the new navigation in subsequent steps.

### Remove
- Old dashboard grid of icon cards (already removed in v23 — confirm it stays gone).
- Per-page back-to-dashboard navigation headers inside individual screens are kept for now (will be migrated in later steps).

## Implementation Plan
1. Create `AppShell` component with:
   - `TopHeader`: fixed top bar, 56px height, white bg, logo center, hamburger left, search + bell right
   - `BottomNav`: fixed bottom bar, role-aware tabs with icons, active state in primary blue (#2563EB)
   - `SideDrawer`: Sheet component sliding from left, user avatar + name at top, 8 menu items with icons
2. Wrap the authenticated `dashboard` screen with `AppShell`
3. Bottom nav tabs each render a placeholder content area (e.g. "Home", "Cases", etc.) — existing pages NOT yet wired
4. Side drawer logout calls existing logout handler
5. All interactive elements get `data-ocid` markers
6. Validate and deploy
