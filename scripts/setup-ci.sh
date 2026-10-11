#!/usr/bin/env bash
# Installs the CI/CD workflow into .github/workflows/.
#
# The automated GitHub App token used by this repo's tooling does NOT have
# "workflows" permission, so it cannot create or update files under
# .github/workflows/ directly. Run this script once from a machine using a
# token that HAS "workflows" permission (e.g. a classic PAT with repo scope,
# or after granting the App the workflows permission on the installation).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/docs/ci-cd-workflow.example.yml"
DST_DIR="$ROOT/.github/workflows"
DST="$DST_DIR/ci-cd.yml"

if [[ ! -f "$SRC" ]]; then
  echo "error: source workflow not found at $SRC" >&2
  exit 1
fi

mkdir -p "$DST_DIR"
cp "$SRC" "$DST"
echo "Wrote $DST"
echo
echo "Next steps:"
echo "  git add .github/workflows/ci-cd.yml"
echo "  git commit -m 'ci: enable GitHub Actions pipeline'"
echo "  git push"
