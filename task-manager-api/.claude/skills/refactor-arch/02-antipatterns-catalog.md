# Anti-Patterns Catalog

Use this catalog to audit any project. For each anti-pattern, look for the listed detection signals and classify severity.

---

## AP-01 — SQL Injection [CRITICAL]

**Description:** User input concatenated directly into SQL query strings.

**Detection signals:**
- `"SELECT * FROM x WHERE id = " + str(id)`
- `"INSERT INTO x VALUES ('" + name + "')"`
- `query += " AND name LIKE '%" + term + "%'"`
- `cursor.execute("... WHERE email = '" + email + "'")`

**Impact:** Full database compromise. Attacker can read, modify, or delete any data.

**Fix:** Use parameterized queries with `?` (sqlite3) or `%s` (psycopg2). Example: `cursor.execute("SELECT * FROM x WHERE id = ?", (id,))`

---

## AP-02 — Hardcoded Credentials / Secrets [CRITICAL]

**Description:** API keys, passwords, secret keys, or connection strings embedded in source code.

**Detection signals:**
- `SECRET_KEY = "some-hardcoded-string"` in app config
- `password = "prod_password_123"` in config objects
- `paymentGatewayKey: "pk_live_..."` in source files
- `API_KEY = "AIzaSy..."` in non-.env files
- Credentials exposed in API responses (e.g., `"secret_key": app.secret_key`)

**Impact:** Credentials leak via version control, logs, or API responses.

**Fix:** Use environment variables and `.env` files. Never commit secrets.

---

## AP-03 — God Class / God Method [CRITICAL]

**Description:** A single class or file contains unrelated responsibilities: routing, business logic, database access, validation, and notifications.

**Detection signals:**
- Single file > 300 lines mixing routes + SQL + business rules
- A class with `setupRoutes()`, `initDb()`, and payment processing all together
- Functions that do input validation, DB query, send emails, and return response

**Impact:** Untestable, unmaintainable, any change risks breaking unrelated features.

**Fix:** Apply Single Responsibility Principle. Separate into Model (data), Controller (orchestration), Service (business logic), Route (HTTP binding).

---

## AP-04 — Unauthenticated Dangerous Endpoints [CRITICAL]

**Description:** Admin or destructive endpoints (reset DB, run raw queries, delete all data) with no authentication.

**Detection signals:**
- `/admin/reset-db` with no auth check
- `/admin/query` accepting raw SQL with no auth
- Admin financial reports accessible without login
- `DELETE /users/:id` with no admin role check

**Impact:** Any anonymous user can destroy or read all data.

**Fix:** Add authentication middleware. Require admin role for destructive operations. Consider removing debug endpoints entirely in production.

---

## AP-05 — Business Logic in Wrong Layer [HIGH]

**Description:** Business rules (calculations, workflow decisions, domain constraints) placed inside route handlers or database models instead of a dedicated service/controller layer.

**Detection signals:**
- Discount calculation inside a `models.py` data function
- Notification sending (email/SMS) inside a controller route function
- Payment processing logic inside a route handler
- Status machine transitions mixed with HTTP response building

**Impact:** Cannot reuse logic, cannot test without HTTP context, violates MVC.

**Fix:** Extract to dedicated service classes. Controllers orchestrate; services implement rules.

---

## AP-06 — N+1 Query Problem [MEDIUM]

**Description:** For each item in a list, a separate database query is executed inside a loop, causing O(N) queries when 1-2 would suffice.

**Detection signals:**
- `for row in rows:` followed by another `cursor.execute(...)` inside the loop
- `for enrollment in enrollments:` with `db.get("SELECT ... WHERE id = ?", [enrollment.user_id])`
- `for user in users:` with `Task.query.filter_by(user_id=u.id).all()` inside loop
- Nested callback chains in Node.js each firing new queries

**Impact:** Performance degrades linearly with data volume. 100 items = 100+ DB round-trips.

**Fix:** Use JOIN queries or eager loading (`db.session.query(Task).options(joinedload(Task.user))`).

---

## AP-07 — Duplicate Code / Copy-Paste Logic [MEDIUM]

**Description:** The same logic block appears 2+ times with minor variations.

**Detection signals:**
- Same validation block (`if not dados: ... if "nome" not in dados: ...`) in multiple functions
- Overdue date calculation (`if t.due_date < datetime.utcnow()`) repeated in 4+ places
- Same dict-building loop for serialization in multiple routes

**Impact:** Bug fixed in one place but not others. Inconsistent behavior.

**Fix:** Extract to shared validator function or use model's `to_dict()` / `is_overdue()` methods that already exist.

---

## AP-08 — Weak or Broken Cryptography [HIGH]

**Description:** Passwords hashed with broken algorithms (MD5, SHA1, custom Base64 schemes) or stored in plaintext.

**Detection signals:**
- `hashlib.md5(pwd.encode()).hexdigest()` for password storage
- `Buffer.from(pwd).toString('base64').substring(0, 2)` as "hash"
- `senha = dados["senha"]` stored directly in DB without hashing
- `"senha": row["senha"]` returned in API responses

**Impact:** Passwords crackable in seconds with rainbow tables. Credential theft via API.

**Fix:** Use `bcrypt`, `argon2`, or `werkzeug.security.generate_password_hash`. Never return passwords in responses.

---

## AP-09 — Fake / Missing Authentication [HIGH]

**Description:** Authentication system that provides no real security — tokens are predictable, not validated, or never checked.

**Detection signals:**
- `'token': 'fake-jwt-token-' + str(user.id)` in login response
- No middleware verifying token on protected routes
- `Authorization` header never read in any route
- All routes accessible without any credential

**Impact:** Any user can access any resource by guessing or constructing a token.

**Fix:** Use real JWT (`PyJWT`, `jsonwebtoken`) with server-side secret. Add auth middleware to protected routes.

---

## AP-10 — Deprecated API Usage [LOW]

**Description:** Use of APIs that are deprecated in the current version of a library, which may be removed in future versions.

**Detection signals (SQLAlchemy 2.0+):**
- `Model.query.get(id)` → deprecated, use `db.session.get(Model, id)`
- `Model.query.filter_by(...)` → still supported but `db.session.execute(select(...))` is preferred
- `db.session.query(Model)` → use `db.session.scalars(select(Model))` in 2.x

**Detection signals (Node.js):**
- `require('crypto').createCipher(...)` → deprecated, use `createCipheriv`
- `new Buffer(...)` → deprecated, use `Buffer.from(...)`

**Impact:** Code will break on library upgrade. May trigger deprecation warnings.

**Fix:** Replace with current API equivalents per library documentation.

---

## AP-11 — Global Mutable State [MEDIUM]

**Description:** Shared mutable variables at module scope that accumulate state across requests.

**Detection signals:**
- `let globalCache = {}` at module top-level, written in request handlers
- `db_connection = None` as global singleton without thread safety
- `totalRevenue = 0` accumulated across calls

**Impact:** Race conditions, memory leaks, incorrect data after concurrent requests.

**Fix:** Use request-scoped context (Flask `g`, Express `res.locals`) or proper caching libraries.

---

## AP-12 — Silent Exception Swallowing [MEDIUM]

**Description:** Bare `except:` or `catch (err)` that ignores the error without logging or re-raising.

**Detection signals:**
- `except:` with no exception type specified
- `except Exception: pass`
- `catch(err) {}` in Node.js (empty catch block)
- `try: ... except: return jsonify({'error': 'internal error'})` with no logging

**Impact:** Bugs become invisible. Production issues impossible to diagnose.

**Fix:** Always specify exception type. Log the exception. Re-raise or return structured error.
