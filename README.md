# Feelings Log

A tiny, offline-first PWA for logging how you feel a few times a day. It's built for iPhone Safari installed to the Home Screen: one-handed, fast multi-select, no account, no backend.

Emotions come from Geoffrey Roberts' **Feel Wheel** (Core › Middle › Outer). All data stays in IndexedDB on your device.

## Features

- **Log**: tap any word at any level to select it. Tapping a deeper word replaces its selected parent (more specific wins). Pick as many as you like, set 1–5 intensity per feeling, and optionally add a note or backdate the time. Search finds words at every level and shows the full path (e.g. `Sad › Hurt › Embarrassed`).
- **History**: check-ins grouped by day. Tap one to edit or delete it.
- **Settings**: System/Light/Dark theme, export JSON (full backup) or CSV (one row per emotion), import a JSON backup (merges by id, so nothing is duplicated), clear all data.
- Works fully offline after the first load. Asks the browser for persistent storage on launch.

## Local development

Requires Node 20.19+ or 22.12+.

```bash
npm install
npm run dev        # http://localhost:5173
```

To test on your phone over Wi-Fi, run `npm run dev -- --host` and open the printed network URL. The service worker and "Add to Home Screen" need HTTPS, so test those against the deployed site or with `npm run preview` on localhost.

```bash
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173/feelings-log/
```

### Project layout

```
src/
  data/feelWheel.ts        static wheel data, colors, path helpers
  db.ts                    Dexie (IndexedDB) setup + live-query hook
  lib/selection.ts         selection rules for the wheel (pure functions)
  lib/exportImport.ts      JSON/CSV export, share/download, JSON import merge
  components/
    CheckInEditor.tsx      picker + selected tray + note/time + Save (used by Log and Edit)
    EmotionWheel.tsx       accordion of core › middle › outer buttons
    EmotionSearch.tsx      search field + results
    SelectedTray.tsx       selected chips with 1–5 intensity
    EditSheet.tsx          full-screen edit/delete for a history entry
  screens/                 Log, History, Settings
public/icon.svg            source icon; PNGs are generated from it
```

To change the icon, edit `public/icon.svg` and run `npm run generate-icons`.

## Deploying to GitHub Pages

1. Create a **public** GitHub repo (e.g. `feelings-log`) and push this project to its `main` branch:
   ```bash
   git add -A && git commit -m "Feelings Log"
   git branch -M main
   git remote add origin https://github.com/<you>/feelings-log.git
   git push -u origin main
   ```
2. On GitHub, go to **Settings › Pages** and set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and deploys on every push to `main`. You can also run it by hand from the **Actions** tab.
4. Your app is live at `https://<you>.github.io/<repo-name>/`.

The Vite `base` path is set from the repo name automatically (`GITHUB_REPOSITORY` in Actions). Locally it defaults to `/feelings-log/`. For a custom domain or a `<you>.github.io` repo, it uses `/`. Set `BASE_PATH` to override it.

The app doesn't use URL routing (tabs are plain state), so there are no 404s on refresh.

## Install on iPhone

1. Open `https://<you>.github.io/<repo-name>/` in **Safari** (other iOS browsers can also add to the Home Screen on iOS 16.4+, but Safari is the most reliable).
2. Tap the **Share** button, then **Add to Home Screen**.
3. Keep **Open as Web App** on, then tap **Add**.
4. Launch **Feelings** from your Home Screen. It opens full-screen and works offline.

Updates install themselves: after you deploy, the next time you open the app it picks up the new version in the background, and the following launch uses it.

## Your data

- Everything is stored **only on this device**, in IndexedDB for the Home Screen app. There's no sync.
- The Home Screen app and Safari have **separate storage**. Entries logged in one won't appear in the other.
- Deleting the Home Screen app, or clearing website data in iOS Settings, erases your log. **Export regularly.** The JSON export is a full backup you can import again later or on a new phone.

### Export formats

- **JSON**: `{ format, version, exportedAt, checkins: CheckIn[] }`, where
  `CheckIn = { id, timestamp, emotions: { path: string[], intensity: 1–5 }[], note?, createdAt, updatedAt }`.
- **CSV**: one row per emotion: `checkin_id, timestamp, core, middle, outer, intensity, note`.

Import accepts the JSON export. Entries are merged by `id`: new ones are added, and an existing one is replaced only if the imported copy has a newer `updatedAt`.
