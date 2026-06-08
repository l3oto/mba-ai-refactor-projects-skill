# Refactoring Playbook

8 transformation patterns with before/after examples. Apply these during Phase 3.

---

## PT-01 — Extract Config to Environment Variables

**Applies to:** Hardcoded secrets, connection strings, API keys in source code.

**Before (Python):**
```python
# app.py
app.config["SECRET_KEY"] = "minha-chave-super-secreta-123"
app.config["DEBUG"] = True
```

**After (Python):**
```python
# src/config/settings.py
import os
SECRET_KEY = os.getenv("SECRET_KEY")
DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
if not SECRET_KEY:
    raise EnvironmentError("SECRET_KEY environment variable is required")

# src/app.py
from config.settings import SECRET_KEY, DEBUG
app.config["SECRET_KEY"] = SECRET_KEY
app.config["DEBUG"] = DEBUG
```

**Before (Node.js):**
```javascript
// utils.js
const config = {
    dbPass: "senha_super_secreta_prod_123",
    paymentGatewayKey: "pk_live_1234567890abcdef",
};
```

**After (Node.js):**
```javascript
// src/config/settings.js
module.exports = {
    dbPass: process.env.DB_PASS,
    paymentGatewayKey: process.env.PAYMENT_GATEWAY_KEY,
};
```

---

## PT-02 — Replace String-Concatenated SQL with Parameterized Queries

**Applies to:** Any `cursor.execute("... " + variable)` pattern.

**Before:**
```python
cursor.execute("SELECT * FROM produtos WHERE id = " + str(id))
cursor.execute("INSERT INTO usuarios VALUES ('" + nome + "', '" + email + "')")
query = "SELECT * FROM produtos WHERE 1=1"
if termo:
    query += " AND nome LIKE '%" + termo + "%'"
cursor.execute(query)
```

**After:**
```python
cursor.execute("SELECT * FROM produtos WHERE id = ?", (id,))
cursor.execute("INSERT INTO usuarios (nome, email) VALUES (?, ?)", (nome, email))

# Dynamic WHERE clauses — build params list
query = "SELECT * FROM produtos WHERE 1=1"
params = []
if termo:
    query += " AND nome LIKE ?"
    params.append(f"%{termo}%")
cursor.execute(query, params)
```

---

## PT-03 — Extract Business Logic from Route to Controller

**Applies to:** Route handlers longer than 10-15 lines containing domain logic.

**Before:**
```python
# controllers.py (mixed route + logic)
def criar_produto():
    dados = request.get_json()
    if not dados:
        return jsonify({"erro": "Dados inválidos"}), 400
    if "nome" not in dados:
        return jsonify({"erro": "Nome é obrigatório"}), 400
    # ... 20 more lines of validation + business rules + DB call
```

**After:**
```python
# src/views/routes.py  (thin route)
@bp.route('/produtos', methods=['POST'])
def criar_produto():
    return produto_controller.criar(request.get_json())

# src/controllers/produto_controller.py  (orchestration)
def criar(dados):
    erro = _validar_produto(dados)
    if erro:
        return jsonify({"erro": erro}), 400
    id = produto_model.criar(dados["nome"], dados.get("descricao",""),
                             dados["preco"], dados["estoque"],
                             dados.get("categoria","geral"))
    return jsonify({"dados": {"id": id}, "sucesso": True}), 201

def _validar_produto(dados):
    if not dados:
        return "Dados inválidos"
    for campo in ("nome", "preco", "estoque"):
        if campo not in dados:
            return f"{campo.capitalize()} é obrigatório"
    if dados["preco"] < 0:
        return "Preço não pode ser negativo"
    return None
```

---

## PT-04 — Extract Notification Side Effects to a Service

**Applies to:** Email/SMS/push notification logic inline in controllers.

**Before:**
```python
# controllers.py
print("ENVIANDO EMAIL: Pedido " + str(resultado["pedido_id"]) + " criado")
print("ENVIANDO SMS: Seu pedido foi recebido!")
print("ENVIANDO PUSH: Novo pedido recebido pelo sistema")
```

**After:**
```python
# src/services/notification_service.py
def pedido_criado(pedido_id, usuario_id):
    # In a real implementation: call email/SMS/push provider
    print(f"[NOTIFICATION] Email: Pedido {pedido_id} criado para usuario {usuario_id}")
    print(f"[NOTIFICATION] SMS: Seu pedido foi recebido!")

# src/controllers/pedido_controller.py
from services.notification_service import pedido_criado
# ...
notification_service.pedido_criado(resultado["pedido_id"], usuario_id)
```

---

## PT-05 — Replace Repeated Overdue Check with Model Method

**Applies to:** Duplicate `if t.due_date < datetime.utcnow()` logic scattered across files.

**Before (repeated 4+ times in routes):**
```python
if t.due_date:
    if t.due_date < datetime.utcnow():
        if t.status != 'done' and t.status != 'cancelled':
            task_data['overdue'] = True
        else:
            task_data['overdue'] = False
    else:
        task_data['overdue'] = False
else:
    task_data['overdue'] = False
```

**After (use the model method that already exists):**
```python
# models/task.py already has:
def is_overdue(self):
    if self.due_date and self.due_date < datetime.utcnow():
        return self.status not in ('done', 'cancelled')
    return False

# routes just call:
task_data['overdue'] = t.is_overdue()
```

---

## PT-06 — Fix N+1 Queries with JOIN or Eager Loading

**Applies to:** Queries inside loops that cause O(N) database round-trips.

**Before (raw sqlite3):**
```python
cursor.execute("SELECT * FROM pedidos WHERE usuario_id = ?", (usuario_id,))
for row in cursor.fetchall():
    cursor2.execute("SELECT * FROM itens_pedido WHERE pedido_id = ?", (row["id"],))
    for item in cursor2.fetchall():
        cursor3.execute("SELECT nome FROM produtos WHERE id = ?", (item["produto_id"],))
```

**After (single JOIN query):**
```python
cursor.execute("""
    SELECT p.*, ip.produto_id, ip.quantidade, ip.preco_unitario, prod.nome as produto_nome
    FROM pedidos p
    LEFT JOIN itens_pedido ip ON ip.pedido_id = p.id
    LEFT JOIN produtos prod ON prod.id = ip.produto_id
    WHERE p.usuario_id = ?
""", (usuario_id,))
```

**Before (SQLAlchemy):**
```python
users = User.query.all()
for u in users:
    tasks = Task.query.filter_by(user_id=u.id).all()  # N+1
```

**After (SQLAlchemy with joinedload):**
```python
from sqlalchemy.orm import joinedload
users = db.session.scalars(
    select(User).options(joinedload(User.tasks))
).all()
for u in users:
    tasks = u.tasks  # already loaded, no extra query
```

---

## PT-07 — Replace Weak Crypto with bcrypt / werkzeug

**Applies to:** MD5 or custom Base64 password hashing.

**Before:**
```python
# models/user.py
import hashlib
def set_password(self, pwd):
    self.password = hashlib.md5(pwd.encode()).hexdigest()
```

**After:**
```python
from werkzeug.security import generate_password_hash, check_password_hash

def set_password(self, pwd):
    self.password = generate_password_hash(pwd)

def check_password(self, pwd):
    return check_password_hash(self.password, pwd)
```

**Before (Node.js):**
```javascript
function badCrypto(pwd) {
    let hash = "";
    for(let i = 0; i < 10000; i++) {
        hash += Buffer.from(pwd).toString('base64').substring(0, 2);
    }
    return hash.substring(0, 10);
}
```

**After (Node.js):**
```javascript
const bcrypt = require('bcrypt');
async function hashPassword(pwd) {
    return bcrypt.hash(pwd, 12);
}
async function verifyPassword(pwd, hash) {
    return bcrypt.compare(pwd, hash);
}
```

---

## PT-08 — Remove Secrets from API Responses

**Applies to:** Endpoints that return sensitive config or credentials.

**Before:**
```python
# controllers.py health_check
return jsonify({
    "status": "ok",
    "versao": "1.0.0",
    "ambiente": "producao",
    "db_path": "loja.db",
    "debug": True,
    "secret_key": "minha-chave-super-secreta-123"   # ← NEVER
}), 200
```

**After:**
```python
return jsonify({
    "status": "ok",
    "database": "connected",
    "counts": {
        "produtos": produtos,
        "usuarios": usuarios,
        "pedidos": pedidos
    }
}), 200
```

Also applies to: never returning `password` field in user responses.

---

## PT-09 — Extract God Class to MVC Layers (Node.js)

**Applies to:** A class like `AppManager` that combines DB init, route setup, business logic, and payments.

**Before:**
```javascript
class AppManager {
    constructor() { this.db = new sqlite3.Database(':memory:'); }
    initDb() { /* creates tables + seeds data */ }
    setupRoutes(app) {
        app.post('/api/checkout', (req, res) => {
            // 60 lines of: validation + user lookup + payment processing + enrollment + audit log
        });
    }
}
```

**After:**
```javascript
// src/config/settings.js     — config
// src/models/User.js         — user DB operations
// src/models/Course.js       — course DB operations
// src/controllers/CheckoutController.js  — checkout orchestration
// src/routes/checkoutRoutes.js          — route binding only
// src/app.js                 — composition root
```

---

## PT-10 — Update Deprecated SQLAlchemy API

**Applies to:** SQLAlchemy 1.x patterns that are deprecated in 2.0.

**Before:**
```python
user = User.query.get(user_id)           # deprecated in 2.0
users = User.query.all()                 # still works but legacy style
tasks = Task.query.filter_by(status='pending').all()
```

**After:**
```python
from sqlalchemy import select
user = db.session.get(User, user_id)     # preferred in 2.0
users = db.session.scalars(select(User)).all()
tasks = db.session.scalars(select(Task).where(Task.status == 'pending')).all()
```
