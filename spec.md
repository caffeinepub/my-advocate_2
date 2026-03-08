# My Advocate

## Current State

The Advocate Verification system has a `VerificationStatus` type (`"not_verified" | "pending" | "verified"`) stored per-user in localStorage via `loadVerificationStatus` / `saveVerificationStatus`. The profile page (`ProfileTab`) shows the verification UI section. The verified state currently shows a green `CheckCircle2` icon with the text "Verified Advocate" inside the verification card only — it does not appear next to the advocate name elsewhere on the platform.

## Requested Changes (Diff)

### Add
- A reusable `VerifiedBadge` inline component: a blue `BadgeCheck` (or `CheckCircle2`) icon with a "Verified Advocate" label in blue, shown inline next to an advocate's name when their verification status is `"verified"`.
- A helper function `getAdvocateVerificationStatus(mobile: string): VerificationStatus` that reads from localStorage — to be used in components that render other advocates' names (feed posts, find advocates, chat header).
- The `VerifiedBadge` displayed next to the advocate's name in:
  1. **Advocate profile page** (`ProfileTab`) — next to the `<h1>` displaying `displayName`
  2. **Legal Feed posts** — next to `{post.authorName}` in both `LegalFeedTab` and `LegalFeedScreen`
  3. **Find Advocates directory** — next to `{profile.fullName}` in both `FindAdvocatesTab` and `FindAdvocatesPage`
  4. **Messages chat header** — next to `{partnerName}` in `ChatScreen`

### Modify
- `LegalFeedTab` and `LegalFeedScreen`: posts need to store or look up the author's mobile to check their verification status. Since posts currently only store `authorName` (no `authorMobile`), we should add `authorMobile?: string` to the `UserPost` interface and populate it when creating posts. For demo posts (`DemoPost`), no badge is shown (no mobile available). For user posts, use the stored `authorMobile` to look up verification status.
- `ChatScreen`: look up the partner's verification status using `partnerUserId` (which is their mobile).
- `FindAdvocatesTab` and `FindAdvocatesPage`: use `advData.userId` to look up verification status.
- `ProfileTab`: use `user.mobile` (the current user's mobile) to look up their own verification status for badge display.

### Remove
- Nothing removed.

## Implementation Plan

1. Add `authorMobile?: string` to the `UserPost` interface.
2. Populate `authorMobile: user.mobile` (or `currentUser.mobile`) when creating new posts in `LegalFeedTab.handleSubmitPost` and `LegalFeedScreen.handleSubmitPost`.
3. Create a small inline `VerifiedBadge` component (blue `BadgeCheck` icon + "Verified Advocate" text, compact, inline-flex).
4. In `ProfileTab`: after the `<h1>{displayName}</h1>`, conditionally render `<VerifiedBadge />` when `verificationStatus === "verified"` and `isAdvocate`.
5. In `LegalFeedTab` and `LegalFeedScreen`: for each post, if it is a `UserPost` and has `authorMobile`, call `loadVerificationStatus(authorMobile)` and show `<VerifiedBadge />` next to `{post.authorName}`.
6. In `FindAdvocatesTab`: next to `{profile.fullName}`, call `loadVerificationStatus(advData.userId)` and show `<VerifiedBadge />` if `"verified"`.
7. In `FindAdvocatesPage`: same as above.
8. In `ChatScreen`: if the partner is an advocate (check via `loadAllAdvocateData()`), call `loadVerificationStatus(partnerUserId)` and show `<VerifiedBadge />` next to `{partnerName}` in the chat header.
