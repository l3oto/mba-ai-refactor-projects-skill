================================
ARCHITECTURE AUDIT REPORT
================================
Project: task-manager-api
Stack:   Python + Flask 2.x + SQLAlchemy
Files:   10 analyzed | ~520 lines of code

## Summary
CRITICAL: 1 | HIGH: 2 | MEDIUM: 4 | LOW: 3

## Findings

### [CRITICAL] Fake JWT Authentication Token
File: routes/user_routes.py:210
Description: The login endpoint returns `'token': 'fake-jwt-token-' + str(user.id)` — a predictable, non-cryptographic string. No middleware in any route file validates this token, meaning authentication is entirely bypassed. Any user can forge a token by knowing (or guessing) another user's ID.
Impact: Authentication provides zero security. All protected operations can be performed by any user without credentials.
Recommendation: Use `PyJWT` to issue signed tokens with `SECRET_KEY` and expiry. Add an `@require_auth` decorator that validates the token before protected routes execute.

### [HIGH] Hardcoded SECRET_KEY
File: app.py:13
Description: `app.config['SECRET_KEY'] = 'super-secret-key-123'` is hardcoded in source. This is the key that should sign JWTs and protect sessions.
Impact: Secret key is exposed in version history. Anyone with read access to the repo can sign arbitrary tokens once real JWT is added.
Recommendation: Load from `os.getenv("SECRET_KEY")`. Raise `EnvironmentError` if not set.

### [HIGH] Password Hashed with MD5
File: models/user.py:29, 32
Description: `hashlib.md5(pwd.encode()).hexdigest()` is used for both storing and verifying passwords. MD5 is cryptographically broken and has precomputed rainbow tables for common passwords.
Impact: If the database is read (via SQL injection elsewhere or direct access), all passwords are crackable within minutes using freely available tools.
Recommendation: Replace with `werkzeug.security.generate_password_hash(pwd)` and `check_password_hash(hash, pwd)`. Existing passwords will need rehash on next login.

### [MEDIUM] Duplicate Overdue Calculation Logic
File: routes/task_routes.py:31-38, routes/task_routes.py:71-80, routes/task_routes.py:282-287, routes/user_routes.py:172-180, routes/report_routes.py:33-41
Description: The same 8-line overdue check (`if t.due_date < datetime.utcnow() and t.status not in ('done', 'cancelled')`) appears in 5 different places. The `Task` model already has an `is_overdue()` method (models/task.py:50-60) that is never called.
Impact: Overdue logic is inconsistent across endpoints. Bug fixes must be applied in 5 places.
Recommendation: Remove all inline copies. Use `t.is_overdue()` which is already correctly implemented in the model.

### [MEDIUM] N+1 Query in Summary Report
File: routes/report_routes.py:53-67
Description: `users = User.query.all()` fetches all users, then `Task.query.filter_by(user_id=u.id).all()` is called once per user inside the loop. With 50 users: 51 SQL queries to build the productivity section.
Impact: Report generation time grows linearly with user count.
Recommendation: Use `joinedload`: `users = db.session.scalars(select(User).options(joinedload(User.tasks))).all()`. Then `u.tasks` is already loaded.

### [MEDIUM] Bare `except:` Clauses Swallowing Errors
File: routes/task_routes.py:62-63, routes/task_routes.py:138, routes/task_routes.py:224, routes/report_routes.py:186, routes/report_routes.py:209
Description: Multiple `except:` blocks (no exception type) catch all exceptions including `KeyboardInterrupt`, `SystemExit`, and programming errors, returning a generic 500 response with no logging.
Impact: Real bugs (AttributeError, TypeError, logic errors) are silently swallowed and appear as vague "internal error" responses. Impossible to diagnose production issues.
Recommendation: Replace with `except Exception as e:` and add `app.logger.error(str(e))`. Re-raise unexpected errors.

### [MEDIUM] Manual Dict Building Instead of Using `to_dict()`
File: routes/task_routes.py:17-29 (get_tasks), routes/user_routes.py:161-170 (get_user_tasks)
Description: Both functions manually build task dictionaries field by field (`task_data['id'] = t.id`, `task_data['title'] = t.title`, ...) even though `Task.to_dict()` already exists and is used in other routes.
Impact: Duplicate serialization logic. If the Task model adds a field, it must be added in 3 places.
Recommendation: Replace manual dict building with `t.to_dict()`.

### [LOW] Deprecated SQLAlchemy `.query.get()` API
File: routes/task_routes.py:67, routes/task_routes.py:157, routes/user_routes.py:29, routes/user_routes.py:94, routes/report_routes.py:105, routes/report_routes.py:157, routes/report_routes.py:213
Description: `Model.query.get(id)` is deprecated in SQLAlchemy 2.0 and will be removed in a future release. Used in 7 locations across route files.
Impact: Application will break on SQLAlchemy 2.0 upgrade.
Recommendation: Replace with `db.session.get(Model, id)` as documented in the SQLAlchemy 2.0 migration guide.

### [LOW] Password Field Exposed in `User.to_dict()`
File: models/user.py:20-21
Description: `User.to_dict()` includes `'password': self.password` in the returned dictionary. This is used in `create_user` (user_routes.py:86) which returns the full dict in the HTTP response.
Impact: Every user creation response returns the (MD5-hashed) password hash to the client.
Recommendation: Remove `password` from `to_dict()`. Add a separate `to_public_dict()` method if needed.

### [LOW] Unused Imports
File: routes/task_routes.py:7 (`import json, os, sys, time`)
Description: All four imports (`json`, `os`, `sys`, `time`) are imported but never used in task_routes.py.
Impact: Minor code clarity and startup overhead.
Recommendation: Remove unused imports.

================================
Total: 10 findings
================================

Phase 2 complete. Proceed with refactoring (Phase 3)? [y/n]
> y
