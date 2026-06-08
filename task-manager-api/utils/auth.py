import os
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify


TOKEN_EXPIRY_HOURS = 24


def _secret_key():
    key = os.getenv('SECRET_KEY', '')
    if not key:
        raise EnvironmentError('SECRET_KEY environment variable is required')
    return key


def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRY_HOURS),
    }
    return jwt.encode(payload, _secret_key(), algorithm='HS256')


def decode_token(token):
    try:
        return jwt.decode(token, _secret_key(), algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token ausente ou inválido'}), 401
        token = auth_header[7:]
        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Token inválido ou expirado'}), 401
        request.user_id = payload['user_id']
        request.user_role = payload['role']
        return f(*args, **kwargs)
    return decorated
