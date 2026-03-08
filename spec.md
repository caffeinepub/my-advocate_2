# My Advocate

## Current State

The app has a full AppShell with a side drawer (hamburger menu). The side drawer currently handles only two items functionally:
- "My Profile" → switches to the `profile` tab
- "Notifications" → switches to the `notifications` tab

All other items (Hearing Calendar, Documents, Case Statistics, Settings, Help) show a "Coming soon" toast. The drawer icons are plain gray with no color differentiation. There is no "View Profile" quick-link in the drawer header. Settings and Help pages do not exist.

All major tab pages already exist as React components:
- `CasesTab` (handles My Cases + Hearings + Calendar sub-tabs)
- `CalendarSubTab` + `CalendarPage`
- `CasesTab` contains `CaseStatisticsSection` (donut chart + bar chart + stat cards)
- `NotificationsTab`
- `ProfileTab`
- `MessagesTab`
- `MyClientsTab`

Documents are stored per-case via `getDocumentsForCase()` and loaded from `loadDocuments()`.

## Requested Changes (Diff)

### Add
- **SettingsTab** component: full settings page with sections for Update Profile Photo, Update Cover Photo, Change Email, Change Mobile Number, Change Password, and Notification Preferences toggle
- **HelpTab** component: help page with FAQ accordion, Contact Support form, Report a Problem form, and About My Advocate section
- **"View Profile" link** in the drawer header (below user name/badge)
- **All-Documents view**: a `DrawerDocumentsTab` component that aggregates all documents across all cases (filtered by role), with filter by document type and case, and view/download actions

### Modify
- **AppShell SideDrawer**: replace plain gray icons with colored icon containers (soft background circles per item), add "View Profile" button in header, wire all menu items to `onDrawerAction` callback instead of showing "Coming soon"
- **App.tsx drawer handler**: map drawer actions to the correct `activeShellTab` values or new drawer-specific tabs: `calendar`, `documents`, `statistics`, `settings`, `help`
- **activeShellTab type/routing**: add support for new pseudo-tabs: `"drawer-calendar"`, `"drawer-documents"`, `"drawer-statistics"`, `"settings"`, `"help"` so they render inside the AppShell content area

### Remove
- `toast.info("Coming soon")` calls for all drawer items except those not yet planned

## Implementation Plan

1. **AppShell.tsx**
   - Add `onDrawerAction: (action: string) => void` prop to `AppShell` and pass it down to `SideDrawer`
   - In `SideDrawer`, replace `handleMenuItemClick` to call `onDrawerAction(itemId)` for all items instead of showing "Coming soon"
   - Redesign each drawer menu item row: wrap the icon in a 36×36 rounded soft-background container with per-item color (User=blue, Calendar=green, FileText=orange, BarChart2=purple, Bell=blue, Settings=slate, HelpCircle=teal)
   - Add a "View Profile →" text button in the drawer profile header below the name/badge

2. **App.tsx**
   - Add new shell tab IDs: `"drawer-calendar"` | `"drawer-documents"` | `"drawer-statistics"` | `"settings"` | `"help"`
   - In the `handleDrawerAction` function (new), map action strings to `setActiveShellTab(...)` calls
   - Add render blocks for new tabs inside the AppShell children block
   - Build `SettingsTab` component inline: sections for photo update (reuses existing crop flow), email/mobile/password change forms with validation, and notification preferences toggle
   - Build `HelpTab` component inline: FAQ accordion (5-6 items), contact support form (name/email/message), report a problem form, and about section
   - Build `DrawerDocumentsTab` component: loads all documents via `loadDocuments()`, filters by `advocateId` or `clientId` per role, shows cards with title/type/date/case-name, filter by docType and case, view/download buttons

3. No backend changes needed. All data is already in localStorage.
