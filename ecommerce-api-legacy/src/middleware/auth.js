const jwt = require('jsonwebtoken');

const TOKEN_EXPIRY = '24h';

function _secretKey() {
    const key = process.env.SECRET_KEY;
    if (!key) {
        throw new Error('SECRET_KEY environment variable is required');
    }
    return key;
}

function generateToken(userId, role) {
    return jwt.sign({ user_id: userId, role }, _secretKey(), { expiresIn: TOKEN_EXPIRY });
}

function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'] || '';
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token ausente ou inválido' });
    }
    const token = authHeader.slice(7);
    try {
        const payload = jwt.verify(token, _secretKey());
        req.userId = payload.user_id;
        req.userRole = payload.role;
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

module.exports = { generateToken, requireAuth };
