# Audit Report Template

Use this exact format when generating the Phase 2 audit report. Do not deviate from the structure.

---

```
================================
ARCHITECTURE AUDIT REPORT
================================
Project: <project-directory-name>
Stack:   <Language> + <Framework>
Files:   <N> analyzed | ~<total-lines> lines of code

## Summary
CRITICAL: <N> | HIGH: <N> | MEDIUM: <N> | LOW: <N>

## Findings

### [CRITICAL] <Anti-Pattern Name>
File: <relative/path/to/file.ext>:<start-line>-<end-line>
Description: <One or two sentences describing exactly what is wrong.>
Impact: <What can go wrong if this is not fixed.>
Recommendation: <Concrete action to fix it.>

### [CRITICAL] <Anti-Pattern Name>
...

### [HIGH] <Anti-Pattern Name>
File: <relative/path/to/file.ext>:<line>
Description: ...
Impact: ...
Recommendation: ...

### [MEDIUM] <Anti-Pattern Name>
...

### [LOW] <Anti-Pattern Name>
...

================================
Total: <N> findings
================================

Phase 2 complete. Proceed with refactoring (Phase 3)? [y/n]
```

---

## Rules for Filling the Template

1. **File paths** must be relative to the project root (e.g., `src/models.py`, not `/home/user/project/src/models.py`)
2. **Line numbers** must be exact — read the file and count
3. **Ordering** is strict: all CRITICAL first, then HIGH, then MEDIUM, then LOW
4. **Each finding** gets a unique name (use the anti-pattern name from the catalog)
5. **Description** must be specific: mention the variable name, function, or line content — not generic
6. **Total count** must match the sum of all severity counts in the Summary
7. If multiple instances of the same anti-pattern exist (e.g., SQL injection in 5 functions), list each as a separate finding OR group them as one finding with all file:line references

## Example Finding

```
### [CRITICAL] SQL Injection — buscar_produtos
File: models.py:291-292
Description: Search query built by string concatenation with user-controlled `termo` and `categoria` parameters. Attacker can inject arbitrary SQL via the `?q=` and `?categoria=` query parameters.
Impact: Full database read/write/delete access without authentication.
Recommendation: Replace string concatenation with parameterized query using sqlite3 `?` placeholders.
```

## Severity Quick Reference

| Severity | Threshold |
|----------|-----------|
| CRITICAL | Security breach, data loss, or complete architectural failure |
| HIGH     | Strong MVC violation, broken auth, weak crypto |
| MEDIUM   | N+1 queries, duplicate code, missing validation |
| LOW      | Naming, deprecated APIs, minor style issues |
