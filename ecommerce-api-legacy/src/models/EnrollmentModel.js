const { getDb } = require('./Database');

function create(userId, courseId) {
    return new Promise((resolve, reject) => {
        getDb().run(
            "INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)",
            [userId, courseId],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

function createPayment(enrollmentId, amount, status) {
    return new Promise((resolve, reject) => {
        getDb().run(
            "INSERT INTO payments (enrollment_id, amount, status) VALUES (?, ?, ?)",
            [enrollmentId, amount, status],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

function logAudit(action) {
    return new Promise((resolve, reject) => {
        getDb().run(
            "INSERT INTO audit_logs (action, created_at) VALUES (?, datetime('now'))",
            [action],
            (err) => { if (err) reject(err); else resolve(); }
        );
    });
}

function getFinancialReport() {
    return new Promise((resolve, reject) => {
        getDb().all(`
            SELECT c.id AS course_id, c.title,
                   u.name AS student_name,
                   p.amount, p.status
            FROM courses c
            LEFT JOIN enrollments e ON e.course_id = c.id
            LEFT JOIN users u ON u.id = e.user_id
            LEFT JOIN payments p ON p.enrollment_id = e.id
            ORDER BY c.id
        `, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = { create, createPayment, logAudit, getFinancialReport };
