const EnrollmentModel = require('../models/EnrollmentModel');
const UserModel = require('../models/UserModel');

async function financialReport(req, res) {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado — requer role admin' });
    }
    try {
        const rows = await EnrollmentModel.getFinancialReport();

        const courseMap = {};
        for (const row of rows) {
            if (!courseMap[row.course_id]) {
                courseMap[row.course_id] = { course: row.title, revenue: 0, students: [] };
            }
            if (row.student_name) {
                courseMap[row.course_id].students.push({
                    student: row.student_name,
                    paid: row.amount || 0,
                });
                if (row.status === 'PAID') {
                    courseMap[row.course_id].revenue += row.amount || 0;
                }
            }
        }

        return res.json(Object.values(courseMap));
    } catch (err) {
        console.error('Report error:', err.message);
        return res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
}

async function deleteUser(req, res) {
    const id = parseInt(req.params.id);
    try {
        const { getDb } = require('../models/Database');
        const user = await new Promise((resolve, reject) => {
            getDb().get("SELECT id FROM users WHERE id = ?", [id], (err, row) => {
                if (err) reject(err); else resolve(row || null);
            });
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        await UserModel.deleteById(id);
        return res.json({ message: 'Usuário e dados relacionados deletados' });
    } catch (err) {
        console.error('Delete user error:', err.message);
        return res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
}

module.exports = { financialReport, deleteUser };
