Review the current branch changes before committing or pushing.

## Steps

1. Gather all local changes:
   - Staged changes: `git diff --cached`
   - Unstaged changes: `git diff`
   - Commits ahead of remote (if remote exists): `git diff origin/HEAD..HEAD`
   - If nothing staged and nothing ahead, review all uncommitted modifications.

2. Read the review standards from `docs/CODE_REVIEW_STANDARDS.md`.

3. Analyse every changed file against those standards.

4. Produce a structured report in this exact format:

```
=== SPINEFIT CODE REVIEW ===

CRITICAL ISSUES (must fix before push):
- [file:line] description

WARNINGS (important, non-blocking):
- [file:line] description

SUGGESTIONS (optional):
- [file:line] description

SUMMARY
CRITICAL_COUNT: N
WARNING_COUNT: N
```

5. If there are any critical issues, attempt to fix them automatically by editing the relevant files. After fixing, re-list which ones were resolved and which remain.

6. End with the final `CRITICAL_COUNT: N` line reflecting only **unfixed** critical issues. If all critical issues were fixed automatically, set `CRITICAL_COUNT: 0`.

Be concise. Do not explain what good code is — only report actual problems found in the diff.
