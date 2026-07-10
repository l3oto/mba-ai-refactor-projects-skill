# ecommerce-api-legacy

LMS API (com fluxo de checkout) em Node.js/Express usada como entrada do desafio `refactor-arch`.

## Como rodar

```bash
npm install
npm start
```

Copie `.env.example` para `.env` e defina `SECRET_KEY`. A aplicação sobe em `http://localhost:3000`. O banco SQLite é em memória e já carrega seeds automaticamente no boot.

Exemplos de requisições estão em `api.http`.

## Autenticação

`GET /api/admin/financial-report` requer um JWT de usuário com `role: admin` no header `Authorization: Bearer <token>`.

Usuário admin de seed (apenas para desenvolvimento/teste):
- email: `leonan@fullcycle.com.br`
- senha: `admin123`

Obtenha o token via `POST /api/login`.
