#!/usr/bin/env bash
# Stop hook for Claude Code: warns when the session ends with uncommitted
# work or unpushed commits. Triggers Claude to commit+push before finalizing.
# Safety net to prevent multi-device work from going missing.

set -u

# No-op outside a git repo
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Uncommitted (modified, staged, untracked-but-not-gitignored)
changes="$(git status --porcelain 2>/dev/null)"

# Unpushed commits — only if an upstream is configured
unpushed=""
if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  unpushed="$(git log '@{u}..HEAD' --oneline 2>/dev/null || true)"
fi

if [ -z "$changes" ] && [ -z "$unpushed" ]; then
  exit 0
fi

{
  echo "TRAVAIL NON SAUVEGARDE SUR GIT — risque de perte entre devices."
  echo

  if [ -n "$changes" ]; then
    file_count=$(printf '%s\n' "$changes" | wc -l | tr -d ' ')
    echo "Fichiers non commités ($file_count) :"
    printf '%s\n' "$changes" | head -20
    if [ "$file_count" -gt 20 ]; then
      echo "  … et $((file_count - 20)) autres"
    fi
    echo
  fi

  if [ -n "$unpushed" ]; then
    commit_count=$(printf '%s\n' "$unpushed" | wc -l | tr -d ' ')
    echo "Commits non poussés sur origin ($commit_count) :"
    printf '%s\n' "$unpushed" | head -5
    echo
  fi

  echo "ACTION REQUISE avant de finir le tour :"
  echo "  1. Pour du code utile : git add + commit + push origin <branch>"
  echo "  2. Pour du junk local : ajouter au .gitignore puis push le .gitignore"
} >&2

exit 2
