import os

SECRET_KEY = os.getenv("SECRET_KEY", "")
DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
DB_PATH = os.getenv("DB_PATH", "loja.db")

CATEGORIAS_VALIDAS = ["informatica", "moveis", "vestuario", "geral", "eletronicos", "livros"]
STATUS_PEDIDO_VALIDOS = ["pendente", "aprovado", "enviado", "entregue", "cancelado"]

if not SECRET_KEY:
    raise EnvironmentError("SECRET_KEY environment variable is required")
