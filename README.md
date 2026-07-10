# Skill de Auditoria e Refatoração Arquitetural

Skill para Claude Code que automatiza a análise, auditoria e refatoração de projetos legados para o padrão MVC, independente da tecnologia (Python/Flask ou Node.js/Express).

---

## Análise Manual

### Projeto 1 — code-smells-project (Python/Flask)

| Severidade | Problema | Arquivo |
|------------|----------|---------|
| CRITICAL | SQL Injection em todas as queries por concatenação de string | `models.py:28, 48-50, 109-113, 289-292` |
| CRITICAL | SECRET_KEY hardcoded no código-fonte | `app.py:7` |
| CRITICAL | Chave secreta exposta na resposta do endpoint `/health` | `controllers.py:289` |
| CRITICAL | Endpoint `/admin/query` executa SQL arbitrário sem autenticação | `app.py:59-78` |
| CRITICAL | Endpoint `/admin/reset-db` apaga todo o banco sem autenticação | `app.py:47-57` |
| HIGH | Lógica de negócio na camada de dados (desconto em `relatorio_vendas`) | `models.py:257-263` |
| HIGH | Notificações inline no controller (email/SMS/push como print statements) | `controllers.py:208-210` |
| HIGH | Senhas em texto plano e retornadas na API | `models.py:79, 96-97` |
| MEDIUM | Validação duplicada entre `criar_produto` e `atualizar_produto` | `controllers.py:28-86` |
| MEDIUM | N+1 queries em pedidos (3 cursors aninhados por pedido) | `models.py:171-233` |
| MEDIUM | Conexão global sem thread-safety | `database.py:4` |
| LOW | Import não utilizado `get_db` em controllers | `controllers.py:2` |
| LOW | Variável `id` sobrescreve built-in Python | `controllers.py:56, 160` |

### Projeto 2 — ecommerce-api-legacy (Node.js/Express)

| Severidade | Problema | Arquivo |
|------------|----------|---------|
| CRITICAL | God Class: AppManager mistura DB, rotas, pagamento e logs | `src/AppManager.js:1-141` |
| CRITICAL | Credenciais de produção hardcoded (`pk_live_`, senha BD) | `src/utils.js:1-7` |
| CRITICAL | Número de cartão de crédito logado no console | `src/AppManager.js:45` |
| CRITICAL | "Hash" de senha completamente quebrado (Base64 substring) | `src/utils.js:17-23` |
| HIGH | Relatório financeiro admin sem autenticação | `src/AppManager.js:80-129` |
| HIGH | DELETE de usuário deixa registros órfãos (reconhecido no código) | `src/AppManager.js:131-137` |
| HIGH | Estado global mutável para cache e receita | `src/utils.js:9-10` |
| MEDIUM | N+1 queries em relatório (queries aninhadas em callbacks) | `src/AppManager.js:88-128` |
| MEDIUM | SQLite in-memory — dados perdidos no restart | `src/AppManager.js:7` |
| MEDIUM | Nomes de variáveis ofuscados (`u`, `e`, `p`, `cid`, `cc`) | `src/AppManager.js:29-33` |
| LOW | Respostas de erro em texto plano ao invés de JSON | `src/AppManager.js:35, 38, 41` |
| LOW | Validação de cartão por prefixo "4" (mock não-funcional) | `src/AppManager.js:47` |

### Projeto 3 — task-manager-api (Python/Flask)

| Severidade | Problema | Arquivo |
|------------|----------|---------|
| CRITICAL | Token JWT fake e não validado em nenhuma rota | `routes/user_routes.py:210` |
| HIGH | SECRET_KEY hardcoded | `app.py:13` |
| HIGH | Senha hash com MD5 (quebrado) | `models/user.py:29, 32` |
| MEDIUM | Cálculo de overdue duplicado em 5 lugares (método `is_overdue()` existe mas nunca usado) | `routes/task_routes.py:31-38, 71-80, 282-287` |
| MEDIUM | N+1 queries no relatório (Task.query por usuário dentro de loop) | `routes/report_routes.py:53-67` |
| MEDIUM | `except:` sem tipo captura tudo silenciosamente | `routes/task_routes.py:62, 138, 224` |
| MEDIUM | Construção manual de dict ignorando `to_dict()` já disponível | `routes/task_routes.py:17-29` |
| LOW | `.query.get()` depreciado no SQLAlchemy 2.0 (7 ocorrências) | múltiplos |
| LOW | Campo `password` exposto em `User.to_dict()` | `models/user.py:20-21` |
| LOW | Imports não usados (`json`, `os`, `sys`, `time`) | `routes/task_routes.py:7` |

---

## Construção da Skill

### Estrutura da Skill

A skill está em `.claude/skills/refactor-arch/` e contém:

```
refactor-arch/
├── SKILL.md                     ← instrução das 3 fases com regras de comportamento
├── 01-project-analysis.md       ← heurísticas de detecção de stack e arquitetura
├── 02-antipatterns-catalog.md   ← 12 anti-patterns com sinais de detecção e severidade
├── 03-report-template.md        ← formato exato do relatório de auditoria
├── 04-architecture-guidelines.md ← estrutura MVC alvo para Python e Node.js
└── 05-refactoring-playbook.md   ← 10 padrões de transformação com exemplos antes/depois
```

### Decisões de Design

**SKILL.md como orquestrador**: O arquivo principal instrui o agente a carregar os arquivos de referência antes de executar qualquer fase. Isso separa o "o que fazer" (SKILL.md) do "como fazer" (arquivos de referência).

**Anti-patterns com sinais concretos**: Em vez de descrições genéricas ("código ruim"), cada anti-pattern tem sinais de detecção literais: `"SELECT * FROM x WHERE id = " + str(id)`. Isso permite que o agente faça grep/busca textual nos arquivos.

**Formato de relatório prescritivo**: O template define campo a campo o que reportar (arquivo, linha, descrição, impacto, recomendação), garantindo consistência entre os 3 projetos.

**Playbook com before/after**: Cada padrão de transformação inclui código real das linguagens-alvo. O agente tem um exemplo concreto para seguir em vez de inferir o padrão.

**Agnóstica de tecnologia**: A detecção de stack usa tabelas de heurísticas por linguagem. O playbook cobre Python e Node.js. As guidelines de arquitetura têm seções separadas para cada stack.

### Anti-patterns no Catálogo

12 anti-patterns cobrindo: SQL Injection, Hardcoded Credentials, God Class, Unauthenticated Endpoints, Business Logic in Wrong Layer, N+1 Queries, Duplicate Code, Weak Crypto, Fake Auth, Deprecated API, Global Mutable State, Silent Exception Swallowing.

Distribuição: CRITICAL (4), HIGH (3), MEDIUM (3), LOW (2).

### Agnosticismo de Tecnologia

- `01-project-analysis.md`: tabelas separadas para Python e Node.js
- `02-antipatterns-catalog.md`: sinais de detecção cobrem Python e JavaScript
- `05-refactoring-playbook.md`: exemplos de código em ambas as linguagens
- `SKILL.md`: instrui o agente a "adaptar à stack detectada"

---

## Resultados

### Resumo dos Relatórios

| Projeto | CRITICAL | HIGH | MEDIUM | LOW | Total |
|---------|----------|------|--------|-----|-------|
| code-smells-project | 5 | 3 | 3 | 2 | 13 |
| ecommerce-api-legacy | 4 | 3 | 3 | 2 | 12 |
| task-manager-api | 1 | 2 | 4 | 3 | 10 |

### Comparação de Estrutura

**Projeto 1 — code-smells-project**

Antes:
```
app.py            ← rotas + admin endpoints perigosos
controllers.py    ← validação + notificações + orquestração misturadas
models.py         ← queries SQL por concatenação + lógica de negócio
database.py       ← conexão global
```

Depois:
```
src/
├── app.py                         ← composition root
├── config/settings.py             ← config por env vars
├── models/produto_model.py        ← queries parametrizadas
├── models/usuario_model.py        ← bcrypt para senha
├── models/pedido_model.py         ← JOIN query (sem N+1)
├── controllers/produto_controller.py
├── controllers/usuario_controller.py
├── controllers/pedido_controller.py
├── views/routes.py                ← blueprint, rotas finas
├── services/notification_service.py
└── middleware/error_handler.py
```

**Projeto 2 — ecommerce-api-legacy**

Antes: AppManager.js (141 linhas) + utils.js (credenciais hardcoded)

Depois:
```
src/
├── app.js                         ← composition root
├── config/settings.js             ← config por process.env
├── models/Database.js             ← init e conexão
├── models/UserModel.js            ← operações de usuário (+ cascade delete)
├── models/CourseModel.js
├── models/EnrollmentModel.js      ← JOIN para relatório (sem N+1)
├── controllers/CheckoutController.js ← bcrypt (sem log de cartão)
├── controllers/ReportController.js
├── routes/checkoutRoutes.js       ← rotas finas
└── middleware/errorHandler.js
```

**Projeto 3 — task-manager-api**

Antes: estrutura MVC parcial com JWT fake, MD5, overdue duplicado, N+1

Depois: mesma estrutura com:
- JWT real via PyJWT (tokens assinados com SECRET_KEY)
- Senha via werkzeug (bcrypt)
- `is_overdue()` centralizado no model
- `joinedload` no relatório (sem N+1)
- `db.session.get()` no lugar do `.query.get()` depreciado
- Bare `except:` substituídos por `except Exception as e:` com logging

### Checklist de Validação

**Projeto 1 — code-smells-project**
- [x] Linguagem detectada: Python
- [x] Framework detectado: Flask 3.1.1
- [x] Domínio: E-commerce API (produtos, pedidos, usuários)
- [x] 4 arquivos analisados
- [x] Relatório com template correto (13 findings)
- [x] Findings com arquivo e linha exatos
- [x] Ordenados por severidade
- [x] 13 findings (>= 5)
- [x] Skill pausa antes da Fase 3
- [x] Estrutura MVC criada em `src/`
- [x] Config extraída para `src/config/settings.py`
- [x] Models com queries parametrizadas
- [x] Controllers com lógica de orquestração
- [x] Views/Routes com blueprint Flask
- [x] Error handler centralizado
- [x] Aplicação inicia sem erros (`GET /health: 200`)
- [x] Endpoints respondem (`GET /produtos: 200`, `POST /produtos: 201`)

**Projeto 2 — ecommerce-api-legacy**
- [x] Linguagem detectada: Node.js
- [x] Framework detectado: Express 4.x
- [x] Domínio: LMS com fluxo de checkout
- [x] 3 arquivos analisados
- [x] Relatório com 12 findings (>= 5), 4 CRITICAL
- [x] Skill pausa antes da Fase 3
- [x] Estrutura MVC em `src/`
- [x] Config extraída para `src/config/settings.js`
- [x] Credenciais removidas do código (uso de `process.env`)
- [x] Senha com bcrypt (sem log de cartão)
- [x] Aplicação inicia sem erros
- [x] Endpoints respondem (`POST /api/checkout: 200`)

**Projeto 3 — task-manager-api**
- [x] Linguagem detectada: Python
- [x] Framework detectado: Flask 3.0 + SQLAlchemy
- [x] Domínio: Task Manager API
- [x] 10 arquivos analisados
- [x] Relatório com 10 findings (>= 5), 1 CRITICAL
- [x] Skill pausa antes da Fase 3
- [x] JWT real substituindo fake token
- [x] Senha com werkzeug (bcrypt)
- [x] `is_overdue()` centralizado
- [x] `joinedload` no relatório
- [x] Aplicação inicia sem erros
- [x] Endpoints respondem (`GET /health: 200`, `POST /login: 200`)

### Logs de Verificação (clone limpo)

Verificação executada a partir de um `git clone` novo do repositório (commit `b2f8447`), sem reaproveitar nenhum estado local, para confirmar que as 3 aplicações sobem e respondem corretamente após a refatoração.

**Projeto 1 — code-smells-project**
```
$ SECRET_KEY=verify-key python src/app.py

$ curl -i http://localhost:5000/health
HTTP/1.1 200 OK
Server: Werkzeug/3.1.8 Python/3.12.3
Content-Type: application/json
Content-Length: 89

$ curl -i http://localhost:5000/produtos
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 1677
```

**Projeto 2 — ecommerce-api-legacy**
```
$ SECRET_KEY=verify-key node src/app.js

$ curl -i -X POST http://localhost:3000/api/checkout -d '{"name":"Verify","email":"verify@x.com","password":"123","course_id":1,"card_number":"4111111111111111"}'
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 35

$ curl -i http://localhost:3000/api/admin/financial-report
HTTP/1.1 401 Unauthorized
Content-Length: 38

$ curl -i -H "Authorization: Bearer <token de admin>" http://localhost:3000/api/admin/financial-report
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 171
```

**Projeto 3 — task-manager-api**
```
$ SECRET_KEY=verify-key python app.py

$ curl -i http://localhost:5000/categories
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 558

$ curl -i http://localhost:5000/reports/summary
HTTP/1.1 401 UNAUTHORIZED
Content-Length: 43

$ curl -i -H "Authorization: Bearer <token>" http://localhost:5000/reports/summary
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 822
```

---

## Como Executar

### Pré-requisitos

- Claude Code instalado e configurado
- Python 3.9+ (projetos 1 e 3)
- Node.js 18+ (projeto 2)

### Executar a skill em cada projeto

```bash
# Projeto 1
cd code-smells-project
claude "/refactor-arch"

# Projeto 2
cd ../ecommerce-api-legacy
claude "/refactor-arch"

# Projeto 3
cd ../task-manager-api
claude "/refactor-arch"
```

### Validar projetos refatorados

```bash
# Projeto 1 — Python/Flask
cd code-smells-project
pip install -r requirements.txt
SECRET_KEY=minha-chave python src/app.py
# GET http://localhost:5000/health → 200

# Projeto 2 — Node.js/Express
cd ecommerce-api-legacy
npm install
node src/app.js
# POST http://localhost:3000/api/checkout → 200

# Projeto 3 — Python/Flask + SQLAlchemy
cd task-manager-api
pip install -r requirements.txt
SECRET_KEY=minha-chave python app.py
# GET http://localhost:5000/health → 200
```

## Objetivo

Você deve entregar uma Skill capaz de:

- Analisar uma codebase detectando linguagem, framework e arquitetura atual
- Identificar anti-patterns e code smells, classificando por severidade com arquivo e linha exatos
- Gerar um relatório de auditoria estruturado com todos os achados
- Refatorar o projeto para o padrão MVC (Model-View-Controller), eliminando os problemas encontrados
- Validar o resultado garantindo que a aplicação continua funcionando após as mudanças

A skill deve ser agnóstica de tecnologia, funcionando com diferentes linguagens e frameworks.

## Contexto

### Definição de Severidades

Para padronizar a sua auditoria e os relatórios gerados pela IA, utilize a seguinte escala de classificação baseada em problemas de MVC e SOLID:

- **CRITICAL:** Falhas graves de arquitetura ou segurança que impedem o funcionamento correto, expõem dados sensíveis (ex: credenciais hardcoded, SQL Injection) ou violam completamente a separação de responsabilidades (ex: "God Class" contendo banco de dados, lógicas complexas e roteamento no mesmo arquivo).
- **HIGH:** Fortes violações do padrão MVC ou princípios SOLID que dificultam muito a manutenção e testes (ex: lógicas de negócio pesadas presas dentro de Controllers, forte acoplamento sem Injeção de Dependência, ou uso de estado global mutável em toda a aplicação).
- **MEDIUM:** Problemas de padronização, duplicação de código ou gargalos de performance moderada (ex: Queries N+1 no banco de dados, uso inadequado de middlewares, validações ausentes nas rotas).
- **LOW:** Melhorias de legibilidade, nomenclatura de variáveis ruins, ou "magic numbers" soltos pelo código.

### Exemplo de Uso no CLI

```bash
# Executar a skill no projeto com problemas
cd code-smells-project
claude "/refactor-arch"
```

```
================================
PHASE 1: PROJECT ANALYSIS
================================
Language:      Python
Framework:      Flask 3.1.1
Dependencies:  flask-cors
Domain:        E-commerce API (produtos, pedidos, usuários)
Architecture:  Monolítica — tudo em 4 arquivos, sem separação de camadas
Source files:  4 files analyzed
DB tables:     produtos, usuarios, pedidos, itens_pedido
================================
```

```
================================
ARCHITECTURE AUDIT REPORT
================================
Project: code-smells-project
Stack:   Python + Flask
Files:   4 analyzed | ~800 lines of code

## Summary
CRITICAL: 4 | HIGH: 5 | MEDIUM: 2 | LOW: 3

## Findings

### [CRITICAL] God Class / God Method
File: models.py:1-350
Description: Arquivo único contém toda lógica de negócio, queries SQL, validação e formatação para 4 domínios diferentes.
Impact: Impossível testar em isolamento, qualquer mudança afeta tudo.
Recommendation: Separar em models e controllers por domínio.

### [CRITICAL] Hardcoded Credentials
File: app.py:8
Description: SECRET_KEY hardcoded como 'minha-chave-super-secreta-123'
...

================================
Total: 14 findings
================================

Phase 2 complete. Proceed with refactoring (Phase 3)? [y/n]
> y
```

```
[... refatoração executada ...]

================================
PHASE 3: REFACTORING COMPLETE
================================
## New Project Structure
src/
├── config/settings.py
├── models/
│   ├── produto_model.py
│   └── usuario_model.py
├── views/
│   └── routes.py
├── controllers/
│   ├── produto_controller.py
│   └── pedido_controller.py
├── middlewares/error_handler.py
└── app.py (composition root)

## Validation
  ✓ Application boots without errors
  ✓ All endpoints respond correctly
  ✓ Zero anti-patterns remaining
================================
```

## Tecnologias obrigatórias

- **Ferramenta:** uma das três opções abaixo (não são aceitas outras ferramentas):
  - Claude Code
  - Gemini CLI
  - OpenAI Codex
- **Recurso:** Custom Skills (ou o equivalente na ferramenta escolhida)
- **Formato dos arquivos de referência:** Markdown
- **Projetos-alvo:** Python/Flask (2 projetos) e Node.js/Express (1 projeto) (fornecidos no repositório base)

> **Nota sobre a ferramenta:** Os exemplos deste documento usam o Claude Code (`.claude/skills/`) como referência, pois é a ferramenta utilizada no curso. Se você optar por Gemini CLI ou Codex, adapte o nome da pasta e o comando de invocação conforme a convenção dela — o conceito de skill e a estrutura interna (SKILL.md + arquivos de referência) permanecem os mesmos.

## Requisitos

### 1. Análise Manual dos Projetos

Antes de criar a skill, você deve entender os problemas que ela vai resolver.

**Tarefas:**

- Analisar o projeto `code-smells-project/` (Python/Flask — API de E-commerce)
- Analisar o projeto `ecommerce-api-legacy/` (Node.js/Express — LMS API com fluxo de checkout)
- Analisar o projeto `task-manager-api/` (Python/Flask — API de Task Manager)

Para cada projeto, identificar e documentar no mínimo 5 problemas, incluindo pelo menos:

- 1 de severidade CRITICAL ou HIGH
- 2 de severidade MEDIUM
- 2 de severidade LOW

Documentar os achados na seção "Análise Manual" do seu `README.md`

> **Dica:** Não precisa encontrar todos os problemas — foque nos que têm maior impacto arquitetural. Use os projetos como insumo para entender quais padrões sua skill precisa detectar.

> **Por que 3 projetos?** Dois são Python/Flask (com níveis de organização diferentes) e um é Node.js/Express. Sua skill precisa funcionar nos 3 para provar que é verdadeiramente agnóstica de tecnologia — lidando tanto com código completamente desestruturado quanto com projetos que já possuem alguma separação de camadas.

### 2. Criação da Skill

Agora que você conhece os problemas, crie uma skill que os detecte, gere um relatório de auditoria e corrija automaticamente.

**Tarefas:**

Criar a skill dentro do projeto `code-smells-project/` e implementar o SKILL.md com 3 fases sequenciais:

- **Fase 1 — Análise:** Detectar stack, mapear arquitetura atual, imprimir resumo
- **Fase 2 — Auditoria:** Cruzar código contra catálogo de anti-patterns, gerar relatório, pedir confirmação
- **Fase 3 — Refatoração:** Reestruturar para o padrão MVC, validar que funciona

Criar arquivos de referência em Markdown que forneçam à skill o conhecimento necessário para executar as 3 fases. Os arquivos devem cobrir **obrigatoriamente** as seguintes áreas de conhecimento:

| Área de conhecimento | O que deve conter |
|---|---|
| Análise de projeto | Heurísticas para detecção de linguagem, framework, banco de dados e mapeamento de arquitetura |
| Catálogo de anti-patterns | Anti-patterns com sinais de detecção e classificação de severidade |
| Template de relatório | Formato padronizado do relatório de auditoria (Fase 2) |
| Guidelines de arquitetura | Regras do padrão MVC alvo (camadas Models, Views/Routes e Controllers, responsabilidades de cada uma) |
| Playbook de refatoração | Padrões concretos de transformação para cada anti-pattern (com exemplos de código) |

> **Nota:** Você tem liberdade para organizar os arquivos de referência como preferir — pode usar os nomes e a quantidade de arquivos que fizer sentido para sua skill. O importante é que todas as 5 áreas de conhecimento estejam cobertas. O nome da skill (`refactor-arch`) e o arquivo `SKILL.md` são obrigatórios e não devem ser alterados. O path da skill segue a convenção da ferramenta escolhida (no Claude Code, por exemplo, é `.claude/skills/refactor-arch/`).

**Requisitos da skill:**

- Deve ser agnóstica de tecnologia — deve funcionar corretamente nos 3 projetos fornecidos, independente da stack ou nível de organização
- O catálogo de anti-patterns deve conter no mínimo 8 anti-patterns com severidade distribuída (CRITICAL, HIGH, MEDIUM, LOW)
- O catálogo deve incluir detecção de APIs deprecated — identificar uso de APIs obsoletas e recomendar o equivalente moderno
- O playbook deve ter no mínimo 8 padrões de transformação com exemplos de código antes/depois
- A Fase 2 deve pausar e pedir confirmação antes de modificar qualquer arquivo
- A Fase 3 deve validar o resultado (boot da aplicação + endpoints funcionando)

### 3. Execução da Skill

Execute sua skill nos 3 projetos e valide que ela funciona em todas as stacks.

#### Projeto 1 — code-smells-project (Python/Flask)

Invocar a skill no Claude Code:

```bash
claude "/refactor-arch"
```

> **Nota:** O comando acima é o exemplo com Claude Code. Se você estiver usando Gemini CLI ou Codex, utilize o comando equivalente para invocar uma skill na sua ferramenta.

- Verificar que a Fase 1 detecta corretamente a stack e imprime o resumo
- Verificar que a Fase 2 encontra no mínimo 5 dos problemas documentados na sua análise manual
- Confirmar a execução da Fase 3
- Verificar que a Fase 3:
  - Cria a estrutura de diretórios baseada em MVC
  - A aplicação inicia sem erros
  - Os endpoints originais continuam respondendo
- Salvar o relatório de auditoria (output da Fase 2) em `reports/audit-project-1.md`
- Commitar o código refatorado do projeto no repositório

#### Projeto 2 — ecommerce-api-legacy (Node.js/Express)

Prove que sua skill é reutilizável em outro projeto de backend, mas com stack diferente.

- Copiar a pasta `.claude/skills/refactor-arch/` para dentro de `ecommerce-api-legacy/`
- Invocar a skill:

```bash
cd ../ecommerce-api-legacy
claude "/refactor-arch"
```

- Verificar que as 3 fases executam corretamente neste projeto
- Salvar o relatório em `reports/audit-project-2.md`
- Commitar o código refatorado do projeto no repositório

#### Projeto 3 — task-manager-api (Python/Flask)

Agora o teste com um projeto Python/Flask que já possui alguma organização de camadas (models, routes, services, utils).

- Copiar a pasta `.claude/skills/refactor-arch/` para dentro de `task-manager-api/`
- Invocar a skill:

```bash
cd ../task-manager-api
claude "/refactor-arch"
```

- Verificar que:
  - A Fase 1 detecta corretamente Python/Flask como stack e identifica o domínio de Task Manager
  - A Fase 2 identifica problemas mesmo em um projeto parcialmente organizado
  - A Fase 3 melhora a estrutura sem quebrar a aplicação (todos os endpoints devem continuar respondendo)
- Salvar o relatório em `reports/audit-project-3.md`
- Commitar o código refatorado do projeto no repositório

> **Nota:** Este projeto já possui alguma separação de camadas, mas isso não significa que a arquitetura está adequada. A skill deve identificar tanto problemas de código (segurança, performance, qualidade) quanto oportunidades de melhoria arquitetural. Se houver mudanças estruturais necessárias, a skill deve propô-las e executá-las.

#### Validação

Para cada projeto refatorado, valide o seguinte checklist:

```markdown
## Checklist de Validação

### Fase 1 — Análise
- [ ] Linguagem detectada corretamente
- [ ] Framework detectado corretamente
- [ ] Domínio da aplicação descrito corretamente
- [ ] Número de arquivos analisados condiz com a realidade

### Fase 2 — Auditoria
- [ ] Relatório segue o template definido nos arquivos de referência
- [ ] Cada finding tem arquivo e linhas exatos
- [ ] Findings ordenados por severidade (CRITICAL → LOW)
- [ ] Mínimo de 5 findings identificados
- [ ] Detecção de APIs deprecated incluída (se aplicável)
- [ ] Skill pausa e pede confirmação antes da Fase 3

### Fase 3 — Refatoração
- [ ] Estrutura de diretórios segue padrão MVC
- [ ] Configuração extraída para módulo de config (sem hardcoded)
- [ ] Models criados para abstrair dados
- [ ] Views/Routes separadas para visualização ou roteamento
- [ ] Controllers concentram o fluxo da aplicação
- [ ] Error handling centralizado
- [ ] Entry point claro
- [ ] Aplicação inicia sem erros
- [ ] Endpoints originais respondem corretamente
```

> **Dica:** Se a skill não detectou problemas suficientes ou a refatoração falhou, ajuste os arquivos de referência e execute novamente. É normal precisar de 2-4 iterações.

## Entregável

Repositório público no GitHub (fork do repositório base) contendo:

- Skill completa em `.claude/skills/refactor-arch/` (dentro dos 3 projetos)
- Código refatorado dos 3 projetos (resultado da execução da Fase 3, commitado no repositório)
- Relatórios de auditoria em `reports/` (3 arquivos)
- `README.md` atualizado

### Estrutura do repositório

Faça um fork do repositório base contendo os três projetos com code smells.

> **Nota:** A estrutura abaixo usa Claude Code como exemplo (`.claude/skills/`). Se estiver usando outra ferramenta, adapte os caminhos conforme a convenção dela.

```
desafio-skills/
├── README.md                              # Sua documentação
│
├── code-smells-project/                   # Projeto 1 — Python/Flask (API de E-commerce)
│   ├── .claude/
│   │   └── skills/
│   │       └── refactor-arch/             # ← SUA SKILL AQUI
│   │           ├── SKILL.md
│   │           └── (arquivos de referência)
│   ├── app.py
│   ├── controllers.py
│   ├── models.py
│   ├── database.py
│   └── requirements.txt
│
├── ecommerce-api-legacy/                  # Projeto 2 — Node.js/Express (LMS API com checkout)
│   ├── .claude/
│   │   └── skills/
│   │       └── refactor-arch/             # ← CÓPIA DA SKILL
│   │           └── ...
│   ├── src/
│   │   ├── app.js
│   │   ├── AppManager.js
│   │   └── utils.js
│   ├── api.http
│   └── package.json
│
├── task-manager-api/                      # Projeto 3 — Python/Flask (API de Task Manager)
│   ├── .claude/
│   │   └── skills/
│   │       └── refactor-arch/             # ← CÓPIA DA SKILL
│   │           └── ...
│   ├── app.py
│   ├── database.py
│   ├── seed.py
│   ├── requirements.txt
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
│
└── reports/                               # Relatórios gerados
    ├── audit-project-1.md                 # Saída da Fase 2 no projeto 1
    ├── audit-project-2.md                 # Saída da Fase 2 no projeto 2
    └── audit-project-3.md                 # Saída da Fase 2 no projeto 3
```

**O que você vai criar:**

- `.claude/skills/refactor-arch/` — A skill completa (SKILL.md + arquivos de referência)
- Código refatorado dos 3 projetos — resultado da execução da Fase 3, commitado no repositório
- `reports/audit-project-{1,2,3}.md` — Relatório de auditoria de cada projeto
- `README.md` — Documentação do seu processo

**O que já vem pronto:**

- `code-smells-project/` — API de E-commerce Python/Flask com code smells intencionais
- `ecommerce-api-legacy/` — LMS API Node.js/Express (com fluxo de checkout) e problemas de implementação
- `task-manager-api/` — API de Task Manager Python/Flask com organização parcial e problemas de segurança/qualidade

> **Dica:** Cada projeto contém problemas intencionais de diferentes severidades (CRITICAL, HIGH, MEDIUM, LOW), incluindo falhas de segurança, violações arquiteturais e problemas de qualidade de código. Parte do desafio é identificá-los por conta própria através da análise manual do código.

### README.md deve conter

**A) Seção "Análise Manual":**

- Lista dos problemas identificados manualmente em cada projeto
- Classificação por severidade
- Justificativa de por que cada problema é relevante

**B) Seção "Construção da Skill":**

- Decisões de design: como estruturou o SKILL.md e os arquivos de referência
- Quais anti-patterns incluiu no catálogo e por quê
- Como garantiu que a skill é agnóstica de tecnologia
- Desafios encontrados e como resolveu

**C) Seção "Resultados":**

- Resumo dos relatórios de auditoria dos 3 projetos (quantos findings por severidade em cada)
- Comparação antes/depois da estrutura de cada projeto
- Checklist de validação preenchido para cada projeto
- Screenshots ou logs mostrando as aplicações rodando após refatoração
- Observações sobre como a skill se comportou em stacks diferentes

**D) Seção "Como Executar":**

- Pré-requisitos (a ferramenta escolhida — Claude Code, Gemini CLI ou Codex — instalada e configurada)
- Comandos para executar a skill em cada projeto
- Como validar que a refatoração funcionou

### Ordem de execução sugerida

**1. Analisar os projetos manualmente**

Leia o código dos três projetos e documente os problemas encontrados.

**2. Criar a skill**

Escreva o SKILL.md e os arquivos de referência.

**3. Executar nos 3 projetos**

```bash
# Projeto 1
cd code-smells-project
claude "/refactor-arch"

# Projeto 2
cd ../ecommerce-api-legacy
claude "/refactor-arch"

# Projeto 3
cd ../task-manager-api
claude "/refactor-arch"
```

Salve a saída da Fase 2 de cada projeto em `reports/audit-project-{1,2,3}.md`.

**4. Iterar**

Se a skill não detectou problemas suficientes ou a refatoração falhou, ajuste os arquivos de referência e execute novamente. É normal precisar de 2-4 iterações.

## Critérios de Aceite

A skill deve atingir os seguintes mínimos em **todos os 3 projetos**:

| Critério | Requisito |
|---|---|
| Fase 1 detecta stack corretamente | OBRIGATÓRIO (3/3 projetos) |
| Fase 2 encontra >= 5 findings | OBRIGATÓRIO (3/3 projetos) |
| Fase 2 inclui pelo menos 1 CRITICAL ou HIGH | OBRIGATÓRIO (3/3 projetos) |
| Fase 3 aplicação funciona após refatoração | OBRIGATÓRIO (3/3 projetos) |

**IMPORTANTE:** Todos os critérios devem ser atingidos nos 3 projetos, não apenas em um!

> **Sobre o projeto 3 (task-manager-api):** Este projeto já possui alguma organização. "aplicação funciona" significa que a API inicia sem erros e todos os endpoints continuam respondendo corretamente.

## Referências

- [Claude Code: Skills](https://docs.anthropic.com/en/docs/claude-code/skills) — Documentação oficial sobre como criar e estruturar Skills
- [Claude Code: Overview](https://docs.anthropic.com/en/docs/claude-code/overview) — Visão geral do Claude Code e suas capacidades
- [The Complete Guide to Building Skills for Claude (PDF)](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf) — Guia completo da Anthropic sobre construção de Skills
- [Equipping Agents for the Real World with Agent Skills](https://claude.com/blog/equipping-agents-for-the-real-world-with-agent-skills) — Blog oficial da Anthropic sobre Agent Skills

---

## Dicas Finais

- **Comece pela análise manual** — entender os problemas profundamente é essencial para criar uma skill que os detecte.
- **O SKILL.md é um prompt** — ele instrui o agente sobre o que fazer, enquanto os arquivos de referência fornecem o conhecimento de domínio.
- **Seja específico nos sinais de detecção** — "código ruim" não ajuda; "query SQL dentro de loop for" é acionável.
- **Teste incrementalmente** — não tente criar a skill perfeita de primeira.
- **A skill deve ser copiável** — se ela só funciona em um projeto específico, está acoplada demais. Teste nos 3 projetos para validar.
- **Projetos diferentes exigem adaptação** — a Fase 3 de um projeto já parcialmente organizado não vai ter as mesmas transformações de um monolito. Sua skill deve se adaptar ao contexto.
- **Pedir confirmação na Fase 2 é obrigatório** — o humano deve revisar o relatório antes de qualquer modificação.
- **Consulte as referências do curso** — revise a documentação oficial da ferramenta escolhida e os materiais das aulas para relembrar a estrutura e anatomia de uma skill.