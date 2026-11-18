---
"@thy-weaver/core": patch
---

Fix `weaver dev` crashing with `TypeError: Cannot read properties of undefined (reading 'push')` when a file changed before any browser tab was open. Every open tab now reloads (before, only the last one connected did), and an error during a rebuild is logged instead of stopping the dev server
