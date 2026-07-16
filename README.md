# advisingtool

Advising planner, handbook search, and course-ingest tooling for the UMD iSchool graduate advising workflow.

## Repository purpose

This repository is the consolidated source of truth for the planner UI, handbook search UI, course catalog data, and ingest workflow. Work from `~/advisingtool` only.

## Repository structure

```text
~/advisingtool
├── .gitignore
├── favicon.ico
├── index.html
├── UMD_Grad_Plan_Builder_Refactored-Final_MultiDomain.html
├── data/
│   └── course_catalog.json
├── planner/
│   └── planner.html
├── scripts/
│   ├── build_embed_and_serve.sh
│   └── ingest_courses.py
├── search-widget/
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
└── embedded/
    └── search/
```

## Current status

The repo contains the planner, the separate Vite/React search widget source, the course catalog data, and the ingest workflow. The embedded search experience is served inside the planner through the existing Handbook Search tab.

## Embedded search workflow

Edit source in `search-widget/`, then build and copy the widget into `embedded/search/` for planner use.

### Standard helper script

```bash
~/advisingtool/scripts/build_embed_and_serve.sh
```

### Manual workflow

```bash
cd ~/advisingtool/search-widget
npm install
npm run build

cd ~/advisingtool
mkdir -p embedded/search
rm -rf embedded/search/*
cp -R search-widget/dist/* embedded/search/
python3 -m http.server 8000
```

### Test URLs

- Planner: `http://localhost:8000/UMD_Grad_Plan_Builder_Refactored-Final_MultiDomain.html`
- Embedded widget: `http://localhost:8000/embedded/search/`

### Important

Do not open the planner or embedded widget with `file://`. Serve the repo over `http://localhost` so the built widget assets load correctly.

## Environment handling

Keep `search-widget/.env` local-only and never commit it.

Expected frontend variables:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ADVISING_INDEX_ID=...
```

## Course ingest

The ingest workflow uses `scripts/ingest_courses.py` with `data/course_catalog.json`.

Example:

```bash
cd ~/advisingtool
export SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d= -f2)
python3 scripts/ingest_courses.py
```

Do not rerun ingest unless source content or ingest logic changes.

## Working rules

- Use `~/advisingtool` as the only working repo.
- Edit search UI in `search-widget/`.
- Treat `embedded/search/` as generated runtime output.
- Keep `.env` files local-only.
- Test via `http://localhost`, not `file://`.
