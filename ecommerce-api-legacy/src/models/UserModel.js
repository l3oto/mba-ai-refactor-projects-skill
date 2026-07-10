const { getDb } = require('./Database');

function findByEmail(email) {
    return new Promise((resolve, reject) => {
        getDb().get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
            if (err) reject(err);
            else resolve(row || null);
        });
    });
}

function create(name, email, passwordHash, role = 'user') {
    return new Promise((resolve, reject) => {
        getDb().run(
            "INSERT INTO users (name, email, pass, role) VALUES (?, ?, ?, ?)",
            [name, email, passwordHash, role],
            function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

function deleteById(id) {
    return new Promise((resolve, reject) => {
        const db = getDb();
        db.serialize(() => {
            db.run("DELETE FROM payments WHERE enrollment_id IN (SELECT id FROM enrollments WHERE user_id = ?)", [id]);
            db.run("DELETE FROM enrollments WHERE user_id = ?", [id]);
            db.run("DELETE FROM users WHERE id = ?", [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

module.exports = { findByEmail, create, deleteById };
