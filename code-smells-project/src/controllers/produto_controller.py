import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from flask import jsonify
from src.models import produto_model
from src.config.settings import CATEGORIAS_VALIDAS


def listar():
    produtos = produto_model.get_todos()
    return jsonify({"dados": produtos, "sucesso": True}), 200


def buscar(produto_id):
    produto = produto_model.get_por_id(produto_id)
    if not produto:
        return jsonify({"erro": "Produto não encontrado", "sucesso": False}), 404
    return jsonify({"dados": produto, "sucesso": True}), 200


def criar(dados):
    erro = _validar(dados, requerido=True)
    if erro:
        return jsonify({"erro": erro}), 400
    produto_id = produto_model.criar(
        dados["nome"], dados.get("descricao", ""),
        dados["preco"], dados["estoque"],
        dados.get("categoria", "geral"),
    )
    return jsonify({"dados": {"id": produto_id}, "sucesso": True, "mensagem": "Produto criado"}), 201


def atualizar(produto_id, dados):
    if not produto_model.get_por_id(produto_id):
        return jsonify({"erro": "Produto não encontrado"}), 404
    erro = _validar(dados, requerido=True)
    if erro:
        return jsonify({"erro": erro}), 400
    produto_model.atualizar(
        produto_id, dados["nome"], dados.get("descricao", ""),
        dados["preco"], dados["estoque"],
        dados.get("categoria", "geral"),
    )
    return jsonify({"sucesso": True, "mensagem": "Produto atualizado"}), 200


def deletar(produto_id):
    if not produto_model.get_por_id(produto_id):
        return jsonify({"erro": "Produto não encontrado"}), 404
    produto_model.deletar(produto_id)
    return jsonify({"sucesso": True, "mensagem": "Produto deletado"}), 200


def pesquisar(termo, categoria, preco_min, preco_max):
    resultados = produto_model.buscar(termo, categoria, preco_min, preco_max)
    return jsonify({"dados": resultados, "total": len(resultados), "sucesso": True}), 200


def _validar(dados, requerido=False):
    if not dados:
        return "Dados inválidos"
    if requerido:
        for campo in ("nome", "preco", "estoque"):
            if campo not in dados:
                return f"{campo.capitalize()} é obrigatório"
    if "preco" in dados and dados["preco"] < 0:
        return "Preço não pode ser negativo"
    if "estoque" in dados and dados["estoque"] < 0:
        return "Estoque não pode ser negativo"
    if "nome" in dados:
        if len(dados["nome"]) < 2:
            return "Nome muito curto"
        if len(dados["nome"]) > 200:
            return "Nome muito longo"
    categoria = dados.get("categoria", "geral")
    if categoria not in CATEGORIAS_VALIDAS:
        return f"Categoria inválida. Válidas: {CATEGORIAS_VALIDAS}"
    return None
