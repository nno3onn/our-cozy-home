#!/usr/bin/env bash

set -uo pipefail

TARGET_REPOSITORY="nno3onn/our-cozy-home"
DRY_RUN=false

usage() {
  cat <<'USAGE'
Usage: bash scripts/create-github-issues.sh [--dry-run]

Creates GitHub Issues from numbered Markdown files in .github/codex-issues.
Use --dry-run to validate and print the actions without creating Issues.
USAGE
}

while (($# > 0)); do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'ERROR: unknown option: %s\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

if ! command -v gh >/dev/null 2>&1; then
  printf 'ERROR: GitHub CLI (gh) is not installed.\n' >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  printf 'ERROR: GitHub CLI is not authenticated. Run: gh auth login\n' >&2
  exit 1
fi

if ! CURRENT_REPOSITORY="$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null)"; then
  printf 'ERROR: unable to determine the current GitHub repository.\n' >&2
  exit 1
fi

if [[ "$CURRENT_REPOSITORY" != "$TARGET_REPOSITORY" ]]; then
  printf 'ERROR: expected repository %s, found %s.\n' "$TARGET_REPOSITORY" "$CURRENT_REPOSITORY" >&2
  exit 1
fi

SCRIPT_DIRECTORY="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPOSITORY_ROOT="$(cd -- "$SCRIPT_DIRECTORY/.." && pwd)"
ISSUE_DIRECTORY="$REPOSITORY_ROOT/.github/codex-issues"

if [[ ! -d "$ISSUE_DIRECTORY" ]]; then
  printf 'ERROR: issue directory not found: %s\n' "$ISSUE_DIRECTORY" >&2
  exit 1
fi

TEMP_DIRECTORY="$(mktemp -d)"
trap 'rm -rf -- "$TEMP_DIRECTORY"' EXIT
EXISTING_TITLES_FILE="$TEMP_DIRECTORY/existing-titles.txt"

if ! gh issue list \
  --repo "$TARGET_REPOSITORY" \
  --state all \
  --limit 1000 \
  --json title \
  --jq '.[].title' >"$EXISTING_TITLES_FILE"; then
  printf 'ERROR: failed to list existing Issues for %s.\n' "$TARGET_REPOSITORY" >&2
  exit 1
fi

shopt -s nullglob
ISSUE_FILES=("$ISSUE_DIRECTORY"/[0-9][0-9][0-9]-*.md)
shopt -u nullglob

if ((${#ISSUE_FILES[@]} == 0)); then
  printf 'ERROR: no numbered Issue files found in %s.\n' "$ISSUE_DIRECTORY" >&2
  exit 1
fi

IFS=$'\n' ISSUE_FILES=($(printf '%s\n' "${ISSUE_FILES[@]}" | LC_ALL=C sort))
unset IFS

created_count=0
skipped_count=0
failed_count=0

for issue_file in "${ISSUE_FILES[@]}"; do
  file_name="$(basename -- "$issue_file")"
  first_line="$(sed -n '1p' "$issue_file")"

  if [[ ! "$first_line" =~ ^#[[:space:]]+(.+)$ ]]; then
    printf '[FAILED] %s: first line must be a non-empty H1.\n' "$file_name" >&2
    ((failed_count += 1))
    continue
  fi

  title="${BASH_REMATCH[1]}"
  body_file="$TEMP_DIRECTORY/${file_name%.md}-body.md"
  tail -n +2 "$issue_file" >"$body_file"

  if grep -Fqx -- "$title" "$EXISTING_TITLES_FILE"; then
    printf '[SKIP] %s: Issue with the same title already exists.\n' "$file_name"
    ((skipped_count += 1))
    continue
  fi

  if [[ "$DRY_RUN" == true ]]; then
    printf '[DRY-RUN] CREATE %s: %s\n' "$file_name" "$title"
    ((created_count += 1))
    continue
  fi

  if issue_url="$(gh issue create \
    --repo "$TARGET_REPOSITORY" \
    --title "$title" \
    --body-file "$body_file" 2>&1)"; then
    printf '[CREATED] %s: %s\n' "$file_name" "$issue_url"
    printf '%s\n' "$title" >>"$EXISTING_TITLES_FILE"
    ((created_count += 1))
  else
    printf '[FAILED] %s: %s\n' "$file_name" "$issue_url" >&2
    ((failed_count += 1))
  fi
done

if [[ "$DRY_RUN" == true ]]; then
  printf 'SUMMARY: dry-run create=%d skip=%d failed=%d total=%d\n' \
    "$created_count" "$skipped_count" "$failed_count" "${#ISSUE_FILES[@]}"
else
  printf 'SUMMARY: created=%d skip=%d failed=%d total=%d\n' \
    "$created_count" "$skipped_count" "$failed_count" "${#ISSUE_FILES[@]}"
fi

if ((failed_count > 0)); then
  exit 1
fi
