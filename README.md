# advisingtool

Advising planner, handbook search, and course-ingest tooling for the UMD iSchool advising workflow.

## Overview

This repository is the consolidated source of truth for the advising planner, the handbook search interface, and the course-ingest workflow. The project was brought together into a single repository and local working folder so future work can continue from one place instead of split folders.

At the current handoff state, GitHub is in sync with the consolidated repo, and Supabase already contains a successful ingest run that inserted 97 course records, skipped 13, and produced 0 errors. In most cases, work should focus on planner UI, search-widget integration, or documentation rather than rerunning ingest.

## Current status

- Repository consolidation is complete, with planner files, ingest scripts, course data, and the search widget all living in one repo.
- The active local source of truth is `~/advisingtool`.
- The prior duplicate local folder at `~/Desktop/grad-advising-widget` has been retired and should not be used.
- The search widget exists inside the repo as a subproject but is not yet fully embedded into the planner runtime.
- The main remaining product decision is how to integrate search into the planner experience more directly.

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
│   └── ingest_courses.py
└── search-widget/
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── App.css
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── useAdvisingSearch.js
        ├── useSourceStatus.js
        ├── lib/
        │   └── supabase.js
        └── assets/
            ├── hero.png
            ├── react.svg
            └── vite.svg
```

The main planner currently lives at `UMD_Grad_Plan_Builder_Refactored-Final_MultiDomain.html`, while the search interface lives in `search-widget/` as a Vite/React app. The ingest pipeline uses `scripts/ingest_courses.py` together with `data/course_catalog.json`.

## Working rules

Use `~/advisingtool` as the only working repository going forward. Do not switch back to the retired duplicate folder or try to maintain multiple local copies.

Keep environment files local-only. The repo `.gitignore` is already configured to ignore `.env`, `.env.*`, `node_modules/`, and `.DS_Store`, and local testing confirmed that `.env` is ignored by Git unless it is force-added manually.

Do not rerun the course ingest unless source content, handbook content, schema, or ingest logic has changed. The last recorded ingest already completed successfully with 0 errors.

## Setup

### Basic repo check

When resuming work, start in the main repo and verify status first.

```bash
cd ~/advisingtool
git status
find . -maxdepth 3 | sort
```

### Search widget development

Use these commands when working on the Vite/React search frontend.

```bash
cd ~/advisingtool/search-widget
npm install
npm run dev
```

The search widget depends on a local `.env` file at `~/advisingtool/search-widget/.env`, which should remain uncommitted.

### Course ingest

Only rerun ingest when course data or ingest logic has changed. The handoff command sequence is:

```bash
cd ~/advisingtool
export SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d= -f2)
python3 scripts/ingest_courses.py
```

This assumes the required environment variables exist locally and that `scripts/ingest_courses.py` is pointed at `data/course_catalog.json`.

## Search widget

The search widget is a separate frontend subproject built with Vite/React and backed by Supabase search and source-status logic. Key source files include `search-widget/src/App.jsx`, `search-widget/src/useAdvisingSearch.js`, `search-widget/src/useSourceStatus.js`, and `search-widget/src/lib/supabase.js`.

Current product direction for this experience is:

- Clean, dense, app-like UI.
- No UMD-branded visual treatment.
- Non-LLM architecture.
- Static, portable, PostgreSQL/Supabase-based implementation.
- Support for planning and schedule development, not only handbook lookup.

## Planner

The main planner file in the repo is `UMD_Grad_Plan_Builder_Refactored-Final_MultiDomain.html`. The search widget has been moved into the same repository, but that does not yet mean it is fully integrated into the planner UI as an in-app tab or embedded surface.

One open cleanup question is whether `planner/planner.html` remains necessary alongside `UMD_Grad_Plan_Builder_Refactored-Final_MultiDomain.html`, or whether one of those files is redundant.

## Ingest notes

The course-ingest workflow reads from `data/course_catalog.json` and inserts course records into Supabase through `scripts/ingest_courses.py`. An earlier bug came from assuming `knowledge_sources.program` was a top-level column, but the actual program value is stored in the `metadata` JSON object.

That issue was fixed by selecting `id,metadata` and mapping source IDs from `metadata.program`. After the correction, the ingest completed successfully and inserted 97 course sections with no errors.

## Safe restart checklist

1. Confirm the working directory is `~/advisingtool`.
2. Confirm the repo is clean before editing.
3. Decide whether the next task is planner UI, search-widget UI, or ingest-related.
4. Work only from this consolidated repo and its subfolders.
5. Keep `.env` local-only.
6. Avoid rerunning ingest unless something relevant changed.

## Known decisions

The project should avoid LLM dependence and stay portable, static, and free of per-call external AI services. The advising search should ultimately help with planning and schedule development, not only act as a handbook knowledge base.

Course domains were also intended to use renamed labels such as `HCI & Design`, `Data & Technology`, and `Accessibility & Inclusive Design`.

## Likely next tasks

- Integrate the search widget into the planner UI as a true embedded experience or tab.
- Standardize how the search widget is built and launched from inside the main repo.
- Keep this README updated as the integration approach becomes more concrete.
- Confirm whether `planner/planner.html` should be kept or retired.