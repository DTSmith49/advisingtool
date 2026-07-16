#!/usr/bin/env bash
set -euo pipefail

ROOT="${HOME}/advisingtool"
WIDGET_DIR="${ROOT}/search-widget"
EMBED_DIR="${ROOT}/embedded/search"
PORT="${1:-8000}"

echo "== Advising tool embed workflow =="
echo "Root:        ${ROOT}"
echo "Widget dir:  ${WIDGET_DIR}"
echo "Embed dir:   ${EMBED_DIR}"
echo "Port:        ${PORT}"
echo

if [[ ! -d "${WIDGET_DIR}" ]]; then
  echo "Missing widget directory: ${WIDGET_DIR}" >&2
  exit 1
fi

cd "${WIDGET_DIR}"

if [[ ! -f ".env" ]]; then
  echo "Missing ${WIDGET_DIR}/.env" >&2
  exit 1
fi

echo "== Installing dependencies =="
npm install

echo
echo "== Building search widget =="
npm run build

echo
echo "== Refreshing embedded/search =="
mkdir -p "${EMBED_DIR}"
rm -rf "${EMBED_DIR}"/*
cp -R dist/* "${EMBED_DIR}/"

echo
echo "== Embedded files =="
find "${EMBED_DIR}" -maxdepth 2 | sort

echo
echo "== Open these URLs =="
echo "Planner: http://localhost:${PORT}/UMD_Grad_Plan_Builder_Refactored-Final_MultiDomain.html"
echo "Widget:  http://localhost:${PORT}/embedded/search/"
echo

cd "${ROOT}"
echo "== Starting local server =="
python3 -m http.server "${PORT}"
