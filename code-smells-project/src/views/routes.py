from flask import Blueprint, request
from src.controllers import produto_controller, usuario_controller, pedido_controller

bp = Blueprint("api", __name__)


# Produtos
@bp.route("/produtos", methods=["GET"])
def listar_produtos():
    return produto_controller.listar()


@bp.route("/produtos/busca", methods=["GET"])
def buscar_produtos():
    preco_min = request.args.get("preco_min")
    preco_max = request.args.get("preco_max")
    return produto_controller.pesquisar(
        request.args.get("q", ""),
        request.args.get("categoria"),
        float(preco_min) if preco_min else None,
        float(preco_max) if preco_max else None,
    )


@bp.route("/produtos/<int:produto_id>", methods=["GET"])
def buscar_produto(produto_id):
    return produto_controller.buscar(produto_id)


@bp.route("/produtos", methods=["POST"])
def criar_produto():
    return produto_controller.criar(request.get_json())


@bp.route("/produtos/<int:produto_id>", methods=["PUT"])
def atualizar_produto(produto_id):
    return produto_controller.atualizar(produto_id, request.get_json())


@bp.route("/produtos/<int:produto_id>", methods=["DELETE"])
def deletar_produto(produto_id):
    return produto_controller.deletar(produto_id)


# Usuários
@bp.route("/usuarios", methods=["GET"])
def listar_usuarios():
    return usuario_controller.listar()


@bp.route("/usuarios/<int:usuario_id>", methods=["GET"])
def buscar_usuario(usuario_id):
    return usuario_controller.buscar(usuario_id)


@bp.route("/usuarios", methods=["POST"])
def criar_usuario():
    return usuario_controller.criar(request.get_json())


@bp.route("/login", methods=["POST"])
def login():
    return usuario_controller.login(request.get_json())


# Pedidos
@bp.route("/pedidos", methods=["POST"])
def criar_pedido():
    return pedido_controller.criar(request.get_json())


@bp.route("/pedidos", methods=["GET"])
def listar_todos_pedidos():
    return pedido_controller.listar_todos()


@bp.route("/pedidos/usuario/<int:usuario_id>", methods=["GET"])
def listar_pedidos_usuario(usuario_id):
    return pedido_controller.listar_usuario(usuario_id)


@bp.route("/pedidos/<int:pedido_id>/status", methods=["PUT"])
def atualizar_status_pedido(pedido_id):
    return pedido_controller.atualizar_status(pedido_id, request.get_json())


# Relatórios
@bp.route("/relatorios/vendas", methods=["GET"])
def relatorio_vendas():
    return pedido_controller.relatorio()
