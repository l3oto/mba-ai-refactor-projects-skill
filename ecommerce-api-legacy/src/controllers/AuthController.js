const bcrypt = require('bcrypt');
const UserModel = require('../models/UserModel');
const { generateToken } = require('../middleware/auth');

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Campos obrigatórios: email, password' });
    }

    try {
        const user = await UserModel.findByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.pass))) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = generateToken(user.id, user.role);
        return res.json({ token });
    } catch (err) {
        console.error('Login error:', err.message);
        return res.status(500).json({ error: 'Erro interno' });
    }
}

module.exports = { login };
