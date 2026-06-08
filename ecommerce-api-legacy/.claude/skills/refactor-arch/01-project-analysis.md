# Project Analysis Heuristics

## Step 1 — Detect Language

| Signal | Language |
|--------|----------|
| `requirements.txt` or `*.py` files | Python |
| `package.json` or `*.js`/`*.ts` files | Node.js / JavaScript |
| `go.mod` or `*.go` files | Go |
| `pom.xml` or `*.java` files | Java |
| `Gemfile` or `*.rb` files | Ruby |

## Step 2 — Detect Framework

### Python
| Signal | Framework |
|--------|-----------|
| `from flask import Flask` | Flask |
| `from fastapi import FastAPI` | FastAPI |
| `from django.db import models` | Django |
| `INSTALLED_APPS` in settings | Django |

Look for version in `requirements.txt`: `Flask==3.1.1`

### Node.js
| Signal | Framework |
|--------|-----------|
| `require('express')` or `import express` | Express |
| `require('@nestjs/core')` | NestJS |
| `require('fastify')` | Fastify |
| `require('koa')` | Koa |

Look for version in `package.json` under `dependencies`.

## Step 3 — Detect Database Layer

| Signal | DB/ORM |
|--------|--------|
| `import sqlite3` + `cursor.execute(...)` | Raw SQLite |
| `from flask_sqlalchemy import SQLAlchemy` | SQLAlchemy ORM |
| `from sqlalchemy import create_engine` | SQLAlchemy Core |
| `require('sqlite3')` | Node sqlite3 |
| `require('sequelize')` | Sequelize ORM |
| `require('mongoose')` | MongoDB / Mongoose |
| `require('pg')` | PostgreSQL (pg) |

## Step 4 — Map Current Architecture

### Monolith signals (all in one or two files)
- Routes, business logic, and DB queries in the same function
- No `models/`, `controllers/`, `services/` directories
- Single large file with 200+ lines

### Partial MVC signals
- Has `models/` directory but routes still contain business logic
- Has `routes/` directory but models do direct DB calls with business rules
- Services exist but are not used consistently

### Full MVC signals
- Separate `models/`, `controllers/`, `views/` or `routes/`
- Controllers only orchestrate; models only handle data
- Config isolated from application code
- Centralized error handling

## Step 5 — Count Source Files

List all non-test source files excluding:
- `.git/`, `node_modules/`, `venv/`, `__pycache__/`
- `.env`, `*.lock`, `*.md`

Report: `N files analyzed`

## Step 6 — Identify DB Tables

**Python/SQLAlchemy:** look for `class X(db.Model)` and `__tablename__`
**Python/raw SQL:** look for `CREATE TABLE` statements
**Node/Sequelize:** look for `sequelize.define(...)` or `Model.init(...)`
**Node/raw SQL:** look for `CREATE TABLE` statements

## Domain Detection

Read route paths and model names to describe what the app does:
- `/produtos`, `produtos` table → "E-commerce product catalog"
- `/tasks`, `Task` model → "Task management system"
- `/enrollments`, `/checkout` → "LMS with payment flow"
- `/users`, `/auth` → "User management"

Combine signals: "E-commerce API (produtos, pedidos, usuários)"
