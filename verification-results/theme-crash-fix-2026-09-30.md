# Theme option click crash — 30 September 2026

User reported Chrome “Aw, Snap! Error code: 4” on both localhost and production when choosing Light, Dark or device mode.

## Reproduction and cause

Reproduced a renderer crash in Chrome 154.0.8037.57 on the previous production deployment by opening the theme picker and clicking the **Light label text**. Reproduced in both visible and headless Chrome. The earlier tests used `radio.check()`, which clicked the input directly and missed the native label activation sequence.

The picker’s bubbling `onBlur` handler closed its `<details>` when a label click temporarily produced no related focus target. This hid the radio while Chrome was forwarding the label click. Suppressing only that focusout handler in an isolated browser allowed 90 consecutive label selections to complete. The same 90-click test passed on the actual fixed local build without any injected workaround.

## Fix

Removed blur-driven dismissal. The picker now closes on actual pointer or focus targets outside its subtree. Escape still closes the picker and returns focus to its trigger. Listeners are cleaned up on unmount. Shared public/admin theme behavior, saved preferences and palettes are unchanged.

## Validation

- TypeScript, ESLint and production build passed.
- All 12 theme browser checks passed locally across desktop, Pixel 7 and 360px mobile.
- Regression case clicks all three label texts repeatedly and checks selection, menu stability, outside clicks and keyboard dismissal.
- Existing preference persistence, cross-tab synchronization, device changes, blocked storage and pre-hydration checks passed.
- Visible Chrome stress check: 90 successful label clicks on fixed local build, no renderer crash.

Production deployment: **READY**, `dpl_CVrXx4QUW2eGV8etCcSb9wxbjRJr`.
- Live: https://simple-technologies.vercel.app
- Immutable deployment: https://simple-technologies-af32xfg9u-talalwaheed3s-projects.vercel.app
- All 12 theme browser checks passed on production (16.2 seconds).
- Visible Chrome completed 90 label selections on production without a crash or injected workaround.
- Signed-in production admin dashboard, inventory, settings and editor checked at desktop and 360px mobile widths. Label clicks switch themes, preserve unsaved editor text and leave the admin brand destination correct. No browser runtime errors observed; temporary account and allowlist removed after verification. No content was saved.

