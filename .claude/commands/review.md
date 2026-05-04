Review all changes that are about to be pushed.

## Steps

1. Get the diff of commits being pushed:
   - If a remote tracking branch exists: `git diff origin/HEAD..HEAD`
   - Otherwise (first push): `git diff HEAD~1..HEAD` or the full diff of all local commits
   - Also check staged-but-uncommitted files: `git diff --cached`

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
