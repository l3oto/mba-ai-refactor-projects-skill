# Architecture Guidelines — Target MVC Structure

## Core Principle

Every layer has exactly one responsibility. No layer reaches into another's concern.

```
HTTP Request
    ↓
[Routes / Views]      ← only: parse request, call controller, return response
    ↓
[Controllers]         ← only: orchestrate: call models, call services, build response data
    ↓
[Services]            ← only: business logic, domain rules, calculations (optional layer)
    ↓
[Models]              ← only: data access, parameterized queries, entity serialization
    ↓
[Config / DB]         ← only: connection setup, environment variables
```

---

## Target Directory Structure

### Python / Flask

```
src/
├── app.py                     ← composition root: creates Flask app, registers blueprints
├── config/
│   └── settings.py            ← all config from env vars; raises error if required vars missing
├── models/
│   ├── __init__.py
│   └── <entity>_model.py      ← one file per domain entity (produto, usuario, pedido...)
├── controllers/
│   ├── __init__.py
│   └── <entity>_controller.py ← orchestration, validation, response building
├── views/
│   ├── __init__.py
│   └── routes.py              ← Flask Blueprint, thin route definitions only
├── services/                  ← optional; for complex business logic
│   └── <domain>_service.py
└── middleware/
    └── error_handler.py       ← centralized error handler registered on the app
```

### Node.js / Express

```
src/
├── app.js                     ← composition root: creates Express app, mounts routes
├── config/
│   └── settings.js            ← all config from process.env
├── models/
│   └── <Entity>.js            ← data access (or Sequelize/Mongoose model)
├── controllers/
│   └── <Entity>Controller.js  ← orchestration, business logic
├── routes/
│   └── <entity>Routes.js      ← Express Router, thin route definitions
├── services/                  ← optional
│   └── <domain>Service.js
└── middleware/
    ├── errorHandler.js        ← Express error middleware (4-arg signature)
    └── auth.js                ← authentication/authorization middleware
```

---

## Layer Rules

### Config Layer (`config/settings.py` or `config/settings.js`)

- Read ALL config from environment variables (use `os.getenv` or `process.env`)
- Provide sensible defaults for non-secret values
- **Raise an error at startup** if required secrets are missing (fail-fast)
- Never hardcode passwords, API keys, or secret keys
- Expose a single config object imported by other modules

```python
# Good
import os
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise EnvironmentError("SECRET_KEY not set")

# Bad
SECRET_KEY = "minha-chave-super-secreta-123"
```

### Models Layer

- **Only** handle data persistence and retrieval
- Use parameterized queries — never string concatenation
- Provide `to_dict()` serialization method
- No HTTP concepts (no `request`, no `jsonify`, no `res.json`)
- No business rules (no discount calculations, no status machine logic)
- No notifications (no `print("SENDING EMAIL")`, no `sendEmail()`)

```python
# Good
def get_by_id(id):
    cursor.execute("SELECT * FROM produtos WHERE id = ?", (id,))
    return cursor.fetchone()

# Bad
def get_by_id(id):
    cursor.execute("SELECT * FROM produtos WHERE id = " + str(id))  # injection
```

### Controllers Layer

- Orchestrate: call model methods, apply simple validation, call services if needed
- Build the response data dict
- No SQL, no direct DB access
- No business logic beyond orchestration
- Handle errors and return appropriate status codes

### Views / Routes Layer

- Only parse incoming request, call controller, return response
- Maximum 5 lines per route handler
- No business logic, no DB calls, no validation logic

```python
# Good
@bp.route('/produtos/<int:id>', methods=['GET'])
def buscar_produto(id):
    return produto_controller.buscar(id)

# Bad
@bp.route('/produtos/<int:id>', methods=['GET'])
def buscar_produto(id):
    produto = models.get_produto_por_id(id)
    if not produto:
        return jsonify({"erro": "Produto não encontrado"}), 404
    return jsonify({"dados": produto, "sucesso": True}), 200
```

### Middleware Layer

- Centralized error handler registered once on the app
- Authentication/authorization middleware (token validation)
- Request logging middleware
- CORS configuration

```python
# Flask error handler pattern
@app.errorhandler(Exception)
def handle_exception(e):
    code = getattr(e, 'code', 500)
    return jsonify({"erro": str(e)}), code
```

---

## Security Checklist for Refactoring

- [ ] All SQL uses parameterized queries (`?` placeholders, never concatenation)
- [ ] Secrets loaded from environment variables (`.env` file, never hardcoded)
- [ ] Passwords hashed with bcrypt or werkzeug (never MD5, never plaintext)
- [ ] Passwords never returned in API responses
- [ ] Admin endpoints protected by auth middleware
- [ ] Dangerous endpoints (`/admin/reset-db`, `/admin/query`) removed or protected
- [ ] Health check endpoint does not expose secrets

## API Contract Preservation

The refactored application MUST maintain the same:
- HTTP methods (GET, POST, PUT, DELETE)
- URL paths (`/produtos`, `/usuarios/<id>`, etc.)
- Request body format
- Response JSON structure (same keys)
- Status codes (200, 201, 400, 404, 500)
