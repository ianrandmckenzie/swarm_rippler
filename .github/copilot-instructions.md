# Copilot Instructions for the Click Sound Rippler Repository

## Project Overview

This repository powers both a static web application and a native desktop app (via Tauri) for creating and learning clicking sounds and glossolalia.

- Web front-end: HTML in `index.html` and `new_word.html`, styles in `css/`, scripts in `js/`, audio assets in `audio/`.
- Desktop app: Tauri wrapper in `src-tauri/` (`main.rs` entrypoint, `lib.rs` setup, `tauri.conf.json`).

## Architecture & Data Flow

- **Storage**: All preferences and click sequences persist to IndexedDB (`dbName = "ClickingGlossaliaDB"`, version 2).
  - `preferences` store holds keys `themePreference`, `tutorialCompleted`, `tutorialDontShow`, `tutorialCurrentStep`.
  - `sequences` store holds click sequences with auto-increment IDs and `timestamp` index.
- **Classes**:
  - `PersistentStorage` in `js/main.js` manages theme, tutorial, sequence listing/deletion.
  - `SequenceStorage` in `js/new_word.js` manages only saving new click sequences.

## Key Files & Patterns

- `js/main.js`
  - Theme toggle logic (dark/system/light) persisted via `PersistentStorage.setTheme()` / `.getTheme()`.
  - Tutorial steps persisted and read via `getTutorialStatus()` / `setTutorialStatus()` APIs.
  - Sequence listing, deletion and `AccessibilityUtils.announce()` for ARIA announcements.
- `js/new_word.js`
  - Defines the 7×7 grid mapping `gridStructure[row][col]` arrays of `"layer-audio"` strings.
  - Toggleable buttons use `.sound-button.clicked` class and `data-layer`/`data-audio` attributes.
  - `saveClickWords()` collects clicked buttons into a nested array (first element always `["5"]`), then saves or falls back to `localStorage`.
- `build.js`
  - Custom Node.js script to copy HTML, CSS, JS, audio and static files into `dist/` for web deployment.
- `package.json`
  - `npm run dev`: launches a simple `python3 -m http.server 8181`
  - `npm run build`: runs `build.js` to generate `dist/`
  - `npm run tauri:dev` / `npm run tauri:build`: Tauri desktop workflows
- `src-tauri/`
  - `main.rs` calls into `app_lib::run()`
  - `lib.rs` configures `tauri_plugin_log` (Info level) in debug builds

## Developer Workflows

1. Install dependencies:
   ```bash
   npm install
   # Rust toolchain via rustup for Tauri
   ```
2. Run web version locally:
   ```bash
   npm run dev    # serves index.html on http://localhost:8181
   ```
3. Desktop development:
   ```bash
   npm run tauri:dev
   ```
4. Build web assets for production:
   ```bash
   npm run build   # outputs to dist/
   ```
5. Build desktop installers:
   ```bash
   npm run tauri:build
   # installers in src-tauri/target/release/bundle/
   ```

## Conventions & Tips

- Always update `build.js` and `.gitignore` if you add new static assets or directories.
- When modifying grid behavior, adjust the 7×7 `gridStructure` in `js/new_word.js` to reflect new layers or audio keys.
- Use `data-layer` and `data-audio` attributes on `<div>` wrappers around `.sound-button` to drive behavior.
- Front-end and Tauri communicate via `tauri.invoke(...)` – see existing patterns in `lib.rs` if adding Rust commands.
- Logging in Tauri debug: configured by `tauri_plugin_log`; inspect logs in console on startup.

---

*Please review and let me know if any sections need more detail or clarification.*
