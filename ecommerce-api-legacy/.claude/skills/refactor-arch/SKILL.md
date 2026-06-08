# Skill: refactor-arch — Architectural Audit & MVC Refactoring

You are an expert software architect. Execute this skill in **3 sequential phases**. Never skip a phase. Never modify files before completing Phase 2 and receiving confirmation.

## Reference Files

Load these files before starting — they contain the knowledge you need:

- `01-project-analysis.md` — stack detection heuristics
- `02-antipatterns-catalog.md` — 10 anti-patterns with severity and detection signals
- `03-report-template.md` — exact format for the audit report
- `04-architecture-guidelines.md` — target MVC structure and rules
- `05-refactoring-playbook.md` — before/after transformation patterns

---

## PHASE 1 — PROJECT ANALYSIS

Read the full codebase. Using `01-project-analysis.md`, detect and print:

```
================================
PHASE 1: PROJECT ANALYSIS
================================
Language:      <language>
Framework:     <framework + version from requirements.txt or package.json>
Dependencies:  <key libs>
Domain:        <what this app does>
Architecture:  <current structure description>
Source files:  <N files analyzed>
DB tables:     <table names if detectable>
================================
```

Rules:
- Read ALL source files (not just entry point)
- Look at imports, decorators, ORM patterns, route definitions
- Describe architecture honestly: "Monolith in N files", "partial MVC", etc.

---

## PHASE 2 — ARCHITECTURE AUDIT

Using `02-antipatterns-catalog.md` and `03-report-template.md`, scan every file and generate the report.

Rules:
- Report EVERY finding, even minor ones
- Include exact file path and line number(s) for each finding
- Order findings: CRITICAL → HIGH → MEDIUM → LOW
- Minimum 5 findings required; surface all you find
- Check for deprecated APIs (SQLAlchemy `.query.get()`, old crypto libs, etc.)
- Flag security issues (hardcoded secrets, SQL injection, weak crypto, no auth)

After printing the report, **STOP and ask**:

```
Phase 2 complete. Proceed with refactoring (Phase 3)? [y/n]
```

Do NOT touch any file until the user types "y" or "yes".

---

## PHASE 3 — REFACTORING

Using `04-architecture-guidelines.md` and `05-refactoring-playbook.md`, restructure the project.

**Order of operations:**
1. Create `src/config/` — extract all hardcoded config to env-based settings
2. Create `src/models/` — one file per domain entity, parameterized queries only
3. Create `src/controllers/` — business logic extracted from routes
4. Create `src/views/` or `src/routes/` — thin route definitions only
5. Create `src/middleware/` — centralized error handling
6. Create new `src/app.py` (or `src/app.js`) — composition root
7. Remove old monolithic files
8. Validate: boot the application and verify endpoints respond

**Validation output:**

```
================================
PHASE 3: REFACTORING COMPLETE
================================
## New Project Structure
<tree of new src/ directory>

## Validation
  ✓ Application boots without errors
  ✓ All endpoints respond correctly
  ✓ Zero anti-patterns remaining
================================
```

If validation fails, fix the issue before reporting success.

---

## Behavior Rules

- This skill is **technology-agnostic** — adapt to Python, Node.js, Go, or any stack
- Never assume a file is unimportant; always read it
- Never introduce new dependencies unless strictly necessary
- Never skip the confirmation step between Phase 2 and Phase 3
- Keep the refactored API contract identical to the original (same endpoints, same HTTP methods)
