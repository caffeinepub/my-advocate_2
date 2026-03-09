# My Advocate

## Current State

The Admin Panel (`AdminPanel.tsx`) already has a basic `AdminVerificationPage` that:
- Shows advocates in Pending/All/Verified/Rejected tabs
- Has Approve and Reject buttons (reject requires a reason)
- Has a "View Details" modal showing advocate profile info and submitted form data
- Saves verification status to `myadvocate_verification` localStorage key
- Does NOT send in-app notifications on approve/reject
- Does NOT have a "View Documents" modal (documents are shown inline as text in the Details modal)
- Does NOT sync the verified badge to the main app (status is saved to localStorage but the main App.tsx reads from the same key so it does sync, but notifications are missing)

The main `App.tsx` has:
- `saveNotification()` function writing to `myadvocate_notifications` key
- `StoredNotification` interface: `{ id, userId, type, title, body, avatarInitials, avatarColor, relatedTab, timestamp, read }`
- `NotificationType` union (case_update, message, hearing, connection, post_like, comment, verification)

## Requested Changes (Diff)

### Add
- `VerificationDocumentsModal`: A separate modal in AdminVerificationPage that opens when admin clicks "View Documents" button, showing the Enrollment Certificate and Advocate ID Card filenames with styled download/preview buttons
- In-app notification dispatch: when admin Approves an advocate, write a notification to `myadvocate_notifications` for that advocate's userId with title "Verification Approved" and body "Your verification has been approved. Your profile now shows the Verified Advocate badge."
- In-app notification dispatch: when admin Rejects an advocate, write a notification for that advocate's userId with the rejection reason as part of the body
- "View Documents" button in each advocate row (visible always if formData exists, not just on pending)
- Document preview modal: shows enrollment cert name and ID card name as styled file items, with a "Download" (demo) and optionally a small preview icon; files stored as names only so preview shows filename with file type icon

### Modify
- `AdminVerificationPage`: Separate "View Details" and "View Documents" into two distinct buttons per row
- `approve()` function: after saving status to localStorage, also call a `pushVerificationNotification(mobile, 'approved')` helper
- `confirmReject()` function: after saving status, also call `pushVerificationNotification(mobile, 'rejected', reason)`
- Add a shared constant for the notifications localStorage key in AdminPanel.tsx

### Remove
- Document filenames shown inline inside the "View Details" modal — move them exclusively to the Documents modal

## Implementation Plan

1. Add `LS_NOTIFICATIONS_KEY = "myadvocate_notifications"` constant to AdminPanel.tsx
2. Add `pushVerificationNotification(mobile, action, reason?)` helper function that constructs and writes a `StoredNotification` object to localStorage
3. Add `VerificationDocumentsModal` component: receives `formData` and `advocateName`, renders a modal with styled file rows (icon + filename + demo download button)
4. Update the advocate row in `AdminVerificationPage` to show both a "View Documents" button (only if formData has document names) and a "View Details" button
5. Wire `approve()` to call `pushVerificationNotification` after status save
6. Wire `confirmReject()` to call `pushVerificationNotification` with the rejection reason
7. Remove document fields from the "View Details" modal (they now live in the documents modal)
8. Add deterministic `data-ocid` markers to all new interactive elements
