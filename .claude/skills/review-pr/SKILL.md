---
name: review-pr
description: |
  Review a GitHub PR using parallel sub-agents for security, code quality, and accessibility.
  Use when:
  - User says "review pr", "review PR #123", or "check this PR"
  - User wants a comprehensive PR review before merging
  - User says "review pull request"
---

# PR Review Skill

Review a GitHub pull request using parallel sub-agents, scoped strictly to the PR's changed files. Spawns concurrent security, code quality, and accessibility reviews, then compiles all findings into a single review comment.

## Arguments

- `$ARGUMENTS` (required): PR number (e.g., `96`, `#96`, or a full GitHub PR URL).
  If omitted, check for a current branch's open PR using `gh pr view`.

## Workflow

### Step 1: Gather PR Context

```bash
# Extract PR number from arguments (strip # prefix if present)
PR_NUMBER=<extracted from $ARGUMENTS>

# Get the list of changed files
gh pr diff $PR_NUMBER --name-only

# Get the full diff for review
gh pr diff $PR_NUMBER

# Get PR metadata
gh pr view $PR_NUMBER --json title,body,baseRefName,headRefName,files
```

Store the list of changed files and the full diff. All subsequent reviews MUST be scoped exclusively to these files. Do NOT review or flag issues in files not touched by this PR.

### Step 2: Launch Parallel Sub-Agent Reviews

Spawn **exactly 3 Task sub-agents concurrently** using the Task tool. Each agent receives:
- The list of changed files
- The full diff content
- Instructions to ONLY review changes in the PR (not pre-existing issues)

#### Sub-Agent 1: Security Review (`security-reviewer` agent)

```
subagent_type: security-reviewer
```

Prompt the agent to:
- Scan all changed files for hardcoded secrets, API keys, tokens, passwords
- Check for authentication/authorization issues in new or modified endpoints
- Look for injection risks (SQL, XSS, command injection, SSRF, path traversal)
- Verify Edge Runtime compatibility (no Node.js-only modules in middleware/edge routes)
- Check for open redirect vulnerabilities in URL handling
- Verify affiliate IDs are not exposed in client-side code
- Check import boundary violations (`@/server/services/*` imported from components)
- Flag any new dependencies with known CVEs

Output format: List of findings with severity (CRITICAL/HIGH/MEDIUM/LOW), file path, line reference, and suggested fix.

#### Sub-Agent 2: Code Quality Review (`code-reviewer` agent)

```
subagent_type: code-reviewer
```

Prompt the agent to:
- Check TypeScript types — no `any` casts, proper type narrowing, correct generics
- Find unused imports or variables in changed files
- Verify error handling — try/catch where needed, proper error boundaries
- Check Next.js best practices — correct use of `'use client'`/`'use server'`, proper metadata exports, correct caching strategies
- Verify SEO-critical patterns — canonical URLs, redirect types (301 vs 302), `noindex,follow` pairing
- Check for `console.log`/`console.error` without dev guards
- Verify import boundaries (pages/components only import from `@/server/api/*`)
- Check for magic numbers, poor naming, excessive nesting (>4 levels)
- Verify functions aren't too large (>50 lines)

Output format: List of findings with severity, file path, line reference, and suggested fix.

#### Sub-Agent 3: Accessibility Review

```
subagent_type: general-purpose
```

Prompt the agent to review ONLY the changed files (provide the file list and diff) for:
- Missing or incorrect ARIA attributes (`aria-label`, `aria-expanded`, `aria-hidden`, `role`)
- Keyboard navigation issues — interactive elements must be focusable and operable via keyboard
- Semantic HTML — proper use of `<button>` vs `<div onClick>`, `<nav>`, `<main>`, `<section>`, heading hierarchy
- Image alt text — all `<img>` and `<Image>` components need meaningful alt text
- Form labels — all inputs need associated `<label>` elements or `aria-label`
- Color contrast concerns if colors are hardcoded in changed files
- Focus management for modals, dropdowns, or dynamic content

Output format: List of findings with severity (HIGH/MEDIUM/LOW), file path, line reference, and suggested fix.

### Step 3: Compile Review

After ALL three sub-agents complete, combine all findings into a single structured review.

#### Decision Logic

**APPROVE** the PR if:
- Zero CRITICAL or HIGH findings across all reviews

**REQUEST CHANGES** if:
- Any CRITICAL or HIGH findings exist

#### Review Comment Format

Post the review using `gh pr review`:

```bash
gh pr review $PR_NUMBER --comment --body "$(cat <<'REVIEW_EOF'
## PR Review Summary

**Status:** APPROVED / CHANGES REQUESTED
**Reviewed files:** X files changed

---

### Security Review
[If no issues: "No security issues found."]
[If issues found, list each with severity, file:line, description, and fix]

### Code Quality Review
[If no issues: "No code quality issues found."]
[If issues found, list each with severity, file:line, description, and fix]

### Accessibility Review
[If no issues: "No accessibility issues found."]
[If issues found, list each with severity, file:line, description, and fix]

---

**Verdict:** [APPROVED — no issues found] / [CHANGES REQUESTED — N issues to address]

> Reviewed by Claude Code (`/review-pr`)
REVIEW_EOF
)"
```

If approving:
```bash
gh pr review $PR_NUMBER --approve --body "No security, quality, or accessibility issues found in the changed files."
```

## Scope Rules (CRITICAL)

These rules prevent noisy, unhelpful reviews:

1. **ONLY review changed files** — Never flag issues in files not modified by the PR
2. **ONLY review changed lines** — Pre-existing issues in modified files should not be flagged unless the PR makes them worse
3. **No style nitpicks** — Do not flag formatting, whitespace, or subjective style preferences
4. **No speculative issues** — Only flag concrete, demonstrable problems
5. **No feature requests** — Do not suggest additional functionality beyond what the PR implements
6. **Severity must be justified** — CRITICAL means "will break production or expose a vulnerability". HIGH means "significant bug or security concern". Don't inflate severity.

## Error Handling

### PR Not Found
```
PR #$PR_NUMBER not found. Verify the PR number and that you have access to the repository.
```

### Sub-Agent Failure
If a sub-agent fails or times out, note it in the review:
```
### [Category] Review
Unable to complete — agent encountered an error. Manual review recommended for this category.
```

