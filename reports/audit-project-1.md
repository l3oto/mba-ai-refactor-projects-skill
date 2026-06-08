================================
ARCHITECTURE AUDIT REPORT
================================
Project: code-smells-project
Stack:   Python + Flask 3.1.1
Files:   4 analyzed | ~700 lines of code

## Summary
CRITICAL: 5 | HIGH: 3 | MEDIUM: 3 | LOW: 2

## Findings

### [CRITICAL] SQL Injection — models.py (multiple functions)
File: models.py:28, 48-50, 57-62, 68, 109-113, 126-130, 140, 149-150, 174, 190, 280-292
Description: Every SQL query is built by string concatenation with unescaped user input. Functions affected: `get_produto_por_id`, `criar_produto`, `atualizar_produto`, `deletar_produto`, `login_usuario`, `criar_usuario`, `criar_pedido`, `get_pedidos_usuario`, `buscar_produtos`. The `buscar_produtos` function (lines 289-292) is especially dangerous as it allows wildcard injection via query parameters `?q=` and `?categoria=`.
Impact: Full database read, write, and delete access for any attacker. Login bypass via `' OR '1'='1`.
Recommendation: Replace all string concatenation with parameterized queries using sqlite3 `?` placeholders.

### [CRITICAL] Hardcoded SECRET_KEY in Source Code
File: app.py:7
Description: Flask secret key `"minha-chave-super-secreta-123"` is hardcoded directly in source code and committed to version control.
Impact: Any developer or contractor with read access to the repo can forge session cookies or HMAC signatures.
Recommendation: Load from environment variable: `app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")`. Raise error if not set.

### [CRITICAL] Secret Key Exposed in API Response
File: controllers.py:289
Description: The `/health` endpoint returns `"secret_key": "minha-chave-super-secreta-123"` as part of the JSON response, alongside `debug: True` and `db_path`.
Impact: Any anonymous HTTP client can read the application secret key, enabling session forgery.
Recommendation: Remove all config values from the health check response. Return only connectivity status and counts.

### [CRITICAL] Unauthenticated Raw SQL Execution Endpoint
File: app.py:59-78
Description: The `/admin/query` endpoint accepts arbitrary SQL via POST body and executes it against the database without any authentication check.
Impact: Full database access (read and write) for any unauthenticated HTTP client. Equivalent to leaving a phpMyAdmin instance open to the internet.
Recommendation: Remove this endpoint entirely. If needed for debugging, require admin authentication and restrict to SELECT-only with query allowlist.

### [CRITICAL] Unauthenticated Database Reset Endpoint
File: app.py:47-57
Description: The `/admin/reset-db` endpoint deletes all data from all tables (produtos, pedidos, itens_pedido, usuarios) without authentication.
Impact: Any unauthenticated request wipes the entire production database.
Recommendation: Remove from production code. If needed in dev, protect with admin auth and add a `ALLOW_RESET=true` env flag.

### [HIGH] Business Logic in Wrong Layer — models.py
File: models.py:257-263
Description: Discount calculation business rule (10% above R$10k, 5% above R$5k, 2% above R$1k) is implemented inside `relatorio_vendas()` in the models layer. Models should only retrieve data.
Impact: Business rule cannot be unit-tested without a database. Changing the discount rule requires modifying the data layer.
Recommendation: Move discount logic to a service class or controller. Model should return raw totals only.

### [HIGH] Business Logic in Wrong Layer — controllers.py (notifications)
File: controllers.py:208-210
Description: Notification side effects (email, SMS, push) are hardcoded as print statements directly inside the `criar_pedido` route handler.
Impact: Cannot test order creation without triggering notifications. Cannot swap notification provider without modifying the controller.
Recommendation: Extract to `notification_service.py`. Call service from controller.

### [HIGH] Passwords Stored Plaintext and Exposed in API
File: models.py:79 (stored), models.py:96-97 (returned), controllers.py:131 (get_todos_usuarios returns password)
Description: Passwords are stored as plaintext in the `usuarios` table and returned in API responses from `get_todos_usuarios` and `get_usuario_por_id`.
Impact: A single database read exposes all user passwords. Any user with access to `GET /usuarios` reads everyone's password.
Recommendation: Hash passwords with `werkzeug.security.generate_password_hash`. Never include `senha` field in serialized responses.

### [MEDIUM] Duplicate Validation Logic
File: controllers.py:28-54 and controllers.py:74-86
Description: Product validation logic (required fields check, price/stock non-negative, name length, category allowlist) is duplicated between `criar_produto` and `atualizar_produto`.
Impact: A bug fix or business rule change must be applied in two places. Risk of divergence.
Recommendation: Extract to `_validar_produto(dados)` helper function.

### [MEDIUM] N+1 Query Problem
File: models.py:171-201 (get_pedidos_usuario), models.py:203-233 (get_todos_pedidos)
Description: For each order, a separate query fetches order items, and for each item, another query fetches the product name. With 10 orders of 5 items each: 1 + 10 + 50 = 61 queries.
Impact: Performance degrades linearly. 100 orders = 600+ round-trips to SQLite.
Recommendation: Replace nested loops with a single JOIN query fetching all data at once.

### [MEDIUM] Global Database Connection Without Thread Safety
File: database.py:4, 10
Description: `db_connection` is a module-level global variable shared across all requests. While `check_same_thread=False` is set, there is no locking mechanism, making concurrent writes unsafe.
Impact: Data corruption under concurrent requests. Flask's development server is single-threaded so this is hidden until production.
Recommendation: Use Flask's `g` object for request-scoped connections, or migrate to SQLAlchemy with connection pooling.

### [LOW] Unused Import
File: controllers.py:2 (`from database import get_db`)
Description: `get_db` is imported in controllers.py but only used directly in the `health_check` function. All other controller functions access the DB through the models module.
Impact: Minor code clarity issue.
Recommendation: Remove unused import or move `health_check` to a dedicated module.

### [LOW] `id` Variable Shadows Built-in
File: controllers.py:56, 160
Description: `id = models.criar_produto(...)` and `id = models.criar_usuario(...)` shadow Python's built-in `id()` function.
Impact: Negligible in this scope, but is a bad practice that can cause subtle bugs in nested scopes.
Recommendation: Rename to `produto_id` and `usuario_id`.

================================
Total: 13 findings
================================

Phase 2 complete. Proceed with refactoring (Phase 3)? [y/n]
> y
