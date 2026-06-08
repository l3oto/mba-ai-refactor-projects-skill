import logging
from flask import jsonify

logger = logging.getLogger(__name__)


def register(app):
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"erro": str(e), "sucesso": False}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"erro": "Recurso não encontrado", "sucesso": False}), 404

    @app.errorhandler(Exception)
    def internal_error(e):
        logger.exception("Unhandled exception")
        return jsonify({"erro": "Erro interno do servidor", "sucesso": False}), 500
