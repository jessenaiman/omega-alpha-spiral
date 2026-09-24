# Current QA capture set — seeded early exits

Run ID: qa-61-seeded-exits-20260924-a
Viewport: desktop, Playwright default 1280 × 720.

Expected gameplay captures from real keyboard movement:
- Shadow exploring, seed 17: `shadow-seed-17.png`
- Ambition exploring, seed 17: `ambition-seed-17.png`
- Shadow exploring, seed 42: `shadow-seed-42.png`
- Ambition exploring, seed 42: `ambition-seed-42.png`

Additional action frames after real navigation: `shadow-action-seed-17.png`, `shadow-action-seed-42.png`, `ambition-action-seed-17.png`, and `ambition-action-seed-42.png`.

Expected structured evidence: `early-floor-bot-report.json`, `seeded-exit-bot.webm`, the existing full-route `artifacts/intro-bot-playtest-report.json`, and `full-intro-to-floors-bot.webm`.
The intro `final-door` test hook only establishes the starting point. The bot must walk the threshold, navigate Light, Shadow, and Ambition, resolve Door/Monster/Chest, and cross each selected physical exit with keyboard input. Captures show appearance; bot assertions establish only the checked mechanics. This pass does not assert aesthetic approval or a complete game release.
