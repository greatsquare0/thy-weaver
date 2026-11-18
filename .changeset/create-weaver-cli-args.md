---
"create-weaver": minor
---

Accept the project options as CLI arguments (`--template`, `--addons`, `--package-name`, `--overwrite`, `--ignore-existing`, `--yes`), so projects can be scaffolded without prompts, e.g. in CI or a devcontainer. Prompts are skipped automatically when there is no terminal. The template system was reworked: the project is now built in memory and written only once it is complete, merged JSON arrays no longer repeat entries, the Tailwind Prettier plugin always comes last, and `--ignore-existing` (and "Ignore files and continue") no longer deletes your own `.gitkeep` files
