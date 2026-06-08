const { getDb } = require('./Database');

function findActiveById(id) {
    return new Promise((resolve, reject) => {
        getDb().get("SELECT * FROM courses WHERE id = ? AND active = 1", [id], (err, row) => {
            if (err) reject(err);
            else resolve(row || null);
        });
    });
}

function findAll() {
    return new Promise((resolve, reject) => {
        getDb().all("SELECT * FROM courses", [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

module.exports = { findActiveById, findAll };
