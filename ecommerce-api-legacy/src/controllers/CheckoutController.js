const bcrypt = require('bcrypt');
const UserModel = require('../models/UserModel');
const CourseModel = require('../models/CourseModel');
const EnrollmentModel = require('../models/EnrollmentModel');
const { saltRounds } = require('../config/settings');

async function checkout(req, res) {
    const { name, email, password, course_id, card_number } = req.body;

    if (!name || !email || !course_id || !card_number) {
        return res.status(400).json({ error: 'Campos obrigatórios: name, email, course_id, card_number' });
    }

    try {
        const course = await CourseModel.findActiveById(course_id);
        if (!course) {
            return res.status(404).json({ error: 'Curso não encontrado' });
        }

        const paymentStatus = _processPayment(card_number);
        if (paymentStatus === 'DENIED') {
            return res.status(400).json({ error: 'Pagamento recusado' });
        }

        let user = await UserModel.findByEmail(email);
        let userId;
        if (!user) {
            const hash = await bcrypt.hash(password || 'changeme', saltRounds);
            userId = await UserModel.create(name, email, hash);
        } else {
            userId = user.id;
        }

        const enrollmentId = await EnrollmentModel.create(userId, course_id);
        await EnrollmentModel.createPayment(enrollmentId, course.price, paymentStatus);
        await EnrollmentModel.logAudit(`Checkout curso ${course_id} por usuario ${userId}`);

        return res.status(200).json({ msg: 'Sucesso', enrollment_id: enrollmentId });
    } catch (err) {
        console.error('Checkout error:', err.message);
        return res.status(500).json({ error: 'Erro interno' });
    }
}

function _processPayment(cardNumber) {
    return cardNumber.startsWith('4') ? 'PAID' : 'DENIED';
}

module.exports = { checkout };
