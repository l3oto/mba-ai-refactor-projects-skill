================================
ARCHITECTURE AUDIT REPORT
================================
Project: ecommerce-api-legacy
Stack:   Node.js + Express 4.x
Files:   3 analyzed | ~170 lines of code

## Summary
CRITICAL: 4 | HIGH: 3 | MEDIUM: 3 | LOW: 2

## Findings

### [CRITICAL] God Class — AppManager
File: src/AppManager.js:1-141
Description: The `AppManager` class combines four unrelated responsibilities: database initialization (`initDb`), route setup (`setupRoutes`), payment processing logic (credit card validation, status determination), and audit logging — all in a single 141-line file. The `setupRoutes` method alone contains 100+ lines of nested business logic.
Impact: Untestable in isolation. Any change to payment logic requires modifying the routing class. Database schema changes require modifying the class that handles HTTP responses.
Recommendation: Extract into: `src/config/database.js`, `src/models/User.js`, `src/models/Course.js`, `src/controllers/CheckoutController.js`, `src/controllers/ReportController.js`, `src/routes/`.

### [CRITICAL] Hardcoded Production Credentials
File: src/utils.js:1-7
Description: Three sensitive credentials are hardcoded: `dbPass: "senha_super_secreta_prod_123"`, `paymentGatewayKey: "pk_live_1234567890abcdef"`, and `smtpUser: "no-reply@fullcycle.com.br"`. The `paymentGatewayKey` is a live production key (prefixed `pk_live_`).
Impact: Any developer with repo access can access the production payment gateway and SMTP account. The live payment key allows unauthorized charges.
Recommendation: Move all config to `process.env` with `.env` file. Rotate the exposed payment gateway key immediately.

### [CRITICAL] Credit Card Number Logged to Console
File: src/AppManager.js:45
Description: `console.log(\`Processando cartão ${cc} na chave ${config.paymentGatewayKey}\`)` — the full card number (`cc`) and the payment gateway API key are logged to stdout on every checkout.
Impact: PCI DSS violation. Card numbers appear in server logs, log aggregators, and any monitoring system. Catastrophic data breach vector.
Recommendation: Never log card numbers. Log only masked values (last 4 digits). Remove the gateway key from logs.

### [CRITICAL] Weak / Broken Password Hashing
File: src/utils.js:17-23, src/AppManager.js:68
Description: `badCrypto()` is explicitly named as broken. It produces a 10-character Base64 substring by iterating 10,000 times — not a cryptographic hash. Passwords stored via this function are trivially reversible.
Impact: Any database read gives attacker all user passwords (after trivial decoding).
Recommendation: Replace with `bcrypt.hash(password, 12)`. Add `bcrypt` to `package.json`.

### [HIGH] Unauthenticated Admin Financial Report
File: src/AppManager.js:80-129
Description: `GET /api/admin/financial-report` returns revenue per course and student payment data with no authentication check. No middleware validates any token before the handler runs.
Impact: Any anonymous HTTP client can read complete financial data: course revenue, student names, and payment amounts.
Recommendation: Add auth middleware to the route. Require admin role.

### [HIGH] Orphaned Records on User Delete
File: src/AppManager.js:131-137
Description: `DELETE /api/users/:id` deletes the user row but leaves `enrollments` and `payments` records in the database with a dangling foreign key. The response message even acknowledges this: `"Usuário deletado, mas as matrículas e pagamentos ficaram sujos no banco."`.
Impact: Referential integrity violations. Financial reports will show revenue for unknown users. Queries on orphaned records will return unexpected results.
Recommendation: Use cascading deletes in the schema or manually delete related records in a transaction before deleting the user.

### [HIGH] Global Mutable State for Cache and Revenue
File: src/utils.js:9-10
Description: `let globalCache = {}` and `let totalRevenue = 0` are module-level mutable variables written by request handlers. Node.js is single-threaded but async, so concurrent requests can corrupt these values.
Impact: Data inconsistency. Cache may return stale data. Revenue counter is never reset and never used in reports (dead code).
Recommendation: Remove `totalRevenue` (dead code). Replace `globalCache` with a proper caching library (e.g., `node-cache`) or Redis.

### [MEDIUM] N+1 Query Problem — Financial Report
File: src/AppManager.js:88-128
Description: The financial report executes nested async queries: SELECT all courses → for each course, SELECT enrollments → for each enrollment, SELECT user + SELECT payment. With 2 courses and 5 enrollments each: 1 + 2 + (5+5) + (5+5) = 23 queries.
Impact: Report generation time grows O(courses × enrollments). Unacceptable at scale.
Recommendation: Use a single JOIN query: `SELECT c.title, u.name, p.amount, p.status FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id LEFT JOIN users u ON u.id = e.user_id LEFT JOIN payments p ON p.enrollment_id = e.id`.

### [MEDIUM] In-Memory SQLite Database
File: src/AppManager.js:7
Description: `new sqlite3.Database(':memory:')` stores all data in RAM. All data is lost on every server restart.
Impact: Not usable for production. Every deploy or crash wipes all users, courses, enrollments, and payments.
Recommendation: Use a file-based database: `new sqlite3.Database('./data/loja.db')`. For production: migrate to PostgreSQL.

### [MEDIUM] Obfuscated Variable Names in Checkout
File: src/AppManager.js:29-33
Description: Request body parameters are assigned to single-letter variables: `u` (name), `e` (email), `p` (password), `cid` (course_id), `cc` (card number). The checkout function is 80+ lines with deeply nested callbacks.
Impact: Code is unreadable. Maintenance risk of swapping `u` and `e`. The nested callback structure makes control flow impossible to follow.
Recommendation: Use descriptive names. Extract `processPaymentAndEnroll` to a separate controller method. Use async/await to flatten callback hell.

### [LOW] Inconsistent Error Response Format
File: src/AppManager.js:35, 38, 41, 48, 54, 56
Description: Some errors return plain text (`res.status(400).send("Bad Request")`, `res.status(404).send("Curso não encontrado")`), while the success response returns JSON (`res.status(200).json({...})`).
Impact: API clients must handle two different response formats. Makes error parsing fragile.
Recommendation: Standardize all responses as JSON: `res.status(400).json({ error: "Bad Request" })`.

### [LOW] Credit Card Validation by Brand Prefix Only
File: src/AppManager.js:47
Description: `cc.startsWith("4")` is used to determine if payment is approved (Visa cards start with 4). Any non-Visa card is denied, and any fake number starting with 4 is accepted.
Impact: Not a production payment validator. If this reaches production, legitimate non-Visa cards are rejected and fraudulent Visa-format strings are accepted.
Recommendation: Integrate a real payment gateway SDK (Stripe, MercadoPago). Remove this mock logic entirely.

================================
Total: 12 findings
================================

Phase 2 complete. Proceed with refactoring (Phase 3)? [y/n]
> y
