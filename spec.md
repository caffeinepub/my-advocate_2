# My Advocate

## Current State

The app has four screens: splash, login (password + OTP tabs), role selection, and dashboard placeholder. All screens currently reference a single uploaded logo at `/assets/uploads/file_000000006f8c72088a0d3624c6aa5bf4-1.png` for every logo placement.

## Requested Changes (Diff)

### Add
- Three distinct logo assets staged in the project:
  - `my-advocate-icon.png` → `/assets/uploads/file_0000000036f0720b93e8a32c87ff91e2-1.png`
  - `my-advocate-header.png` → `/assets/uploads/file_0000000067dc720b979aa33b95fe860c-2.png`
  - `my-advocate-splash.png` → `/assets/uploads/file_000000003c74720b8f411065c41e45f4-3.png`

### Modify
- **SplashScreen**: Replace old logo with `my-advocate-splash.png`. Remove any redundant "MY ADVOCATE" / tagline text below the logo since the splash image already contains the full brand identity. Keep white background, centered layout, fade animation.
- **LoginScreen logo**: Replace with `my-advocate-icon.png` at ~60px height.
- **OTP verify step**: Currently shows no standalone logo at top — no change needed (icon already visible via tab context). If a logo is shown, use `my-advocate-icon.png`.
- **RoleSelectionScreen logo**: Replace with `my-advocate-icon.png` at ~60px height.
- **DashboardScreen (placeholder header area)**: Add `my-advocate-header.png` as a clickable header logo in the top-left, linking/navigating to dashboard root. Height ~36px, constrained proportionally. (Since this is a placeholder screen it should show the header logo for consistency.)
- All logo `img` elements must use `object-fit: contain`, no stretching, with appropriate `alt` text.

### Remove
- All references to the old single logo path `file_000000006f8c72088a0d3624c6aa5bf4-1.png`.

## Implementation Plan

1. In `App.tsx`:
   - Update `SplashScreen` to use splash logo path; remove redundant text below if image already contains branding.
   - Update `LoginScreen` logo `<img>` src to icon path, set height to 60px.
   - Update `RoleSelectionScreen` logo `<img>` src to icon path, set height to 60px.
   - Add a header bar to `DashboardScreen` with `my-advocate-header.png` in the top-left (height ~36px, clickable, navigates to dashboard).
   - Ensure no logo is stretched; all use `object-fit: contain`.
2. Validate frontend build.
