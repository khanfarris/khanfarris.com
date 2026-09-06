# Shiftfall on khanfarris.com

Static game at `/shiftfall/`. Fresh browser storage key: `khanfarris-shiftfall-v1`. No account, backend, or import from the earlier hosted game. Visitors keep separate browser saves. Download full backups regularly; browser storage is not a permanent archive.

Install dependencies in this folder, then run `npm run build`. Commit the generated `shiftfall/game.js` and `shiftfall/game.css` with source changes. Existing builds can use `SHIFTFALL_DEPENDENCIES` pointing to a compatible node_modules directory.

To publish Farris's work: receive the explicitly selected backup, validate it with `parseBackup`, and generate `portfolioHTML` as `shiftfall/casebook.html`. Review the notes and exported page before publishing. The public casebook is a read-only snapshot; do not bundle the private browser backup or automatically publish drafts. Preserve the website navigation in the casebook. The empty page is intentional until Farris supplies completed work.

The casebook and play session are separate. Never load the published casebook into a visitor's game save.
