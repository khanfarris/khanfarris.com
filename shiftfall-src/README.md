# Shiftfall on khanfarris.com

Static game at `/shiftfall/`. Fresh browser storage key: `khanfarris-shiftfall-v1`. No account, backend, or import from the earlier hosted game. Visitors keep separate browser saves. Download full backups regularly; browser storage is not a permanent archive.

Install dependencies in this folder, then run `npm run build`. Commit the generated `shiftfall/game.js` and `shiftfall/game.css` with source changes. Existing builds can use `SHIFTFALL_DEPENDENCIES` pointing to a compatible node_modules directory.

Farris's published profile is `shiftfall/khanfarris-profile.json`, loaded into the same game UI at `/shiftfall/#khanfarris`. The toggle returns to the visitor's editable browser save. The profile hook never writes localStorage; mutations are disabled and its setter is a no-op. Selection is separate view state. No login or online user accounts are involved. The old casebook URL redirects to the profile.

To update the profile, receive the explicitly selected backup, validate with `parseBackup`, compare against the previous published snapshot, preserve earlier records, and publish the selected data in `khanfarris-profile.json`. Keep author notes verbatim. Record requested post-completion corrections in provenance and reconcile dependent score totals. Never manufacture completed incidents. Never automatically publish future browser changes. Do not replace a visitor's local save with this snapshot.

The profile and play session are separate. Run `scripts/test-shiftfall-profile.cjs` with `PLAYWRIGHT_MODULE` pointing to Playwright to check isolation and read-only behavior using installed Edge.

Shift navigation separates the viewed shift from the active run. Future previews use the same seeded queue as progression and show only titles and briefs. Completed shifts are saved in `shiftHistory` on closure and before advancing, included in JSON backups, and displayed read-only. Older backups without snapshots show their saved case records without inventing historical metrics. Published profiles default to the latest completed shift when available. Run `scripts/test-shiftfall-shifts.cjs` to verify browsing, progression, history, legacy saves, and mobile width.
