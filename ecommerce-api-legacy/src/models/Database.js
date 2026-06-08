const sqlite3 = require('sqlite3').verbose();

let db = null;

function getDb() {
    if (!db) {
        db = new sqlite3.Database(':memory:');
    }
    return db;
}

function init() {
    return new Promise((resolve, reject) => {
        const database = getDb();
        database.serialize(() => {
            database.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, pass TEXT)");
            database.run("CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY, title TEXT, price REAL, active INTEGER)");
            database.run("CREATE TABLE IF NOT EXISTS enrollments (id INTEGER PRIMARY KEY, user_id INTEGER, course_id INTEGER)");
            database.run("CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY, enrollment_id INTEGER, amount REAL, status TEXT)");
            database.run("CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY, action TEXT, created_at DATETIME)");

            database.run("INSERT INTO users (name, email, pass) VALUES ('Leonan', 'leonan@fullcycle.com.br', '$2b$12$placeholder_hash')");
            database.run("INSERT INTO courses (title, price, active) VALUES ('Clean Architecture', 997.00, 1), ('Docker', 497.00, 1)");
            database.run("INSERT INTO enrollments (user_id, course_id) VALUES (1, 1)");
            database.run("INSERT INTO payments (enrollment_id, amount, status) VALUES (1, 997.00, 'PAID')", (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

module.exports = { getDb, init };
