import logging

logger = logging.getLogger(__name__)


def pedido_criado(pedido_id, usuario_id):
    logger.info(f"[EMAIL] Pedido {pedido_id} criado para usuario {usuario_id}")
    logger.info(f"[SMS] Seu pedido #{pedido_id} foi recebido!")
    logger.info(f"[PUSH] Novo pedido recebido pelo sistema")


def pedido_aprovado(pedido_id):
    logger.info(f"[NOTIFICACAO] Pedido {pedido_id} aprovado — preparar envio")


def pedido_cancelado(pedido_id):
    logger.info(f"[NOTIFICACAO] Pedido {pedido_id} cancelado — devolver estoque")
