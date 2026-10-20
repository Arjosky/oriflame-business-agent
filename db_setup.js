const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./oriflame_business.db');

db.serialize(() => {
    // কন্টাক্ট টেবিল তৈরি
    db.run("CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, status TEXT)");

    // ডেটা সেভ করার উদাহরণ
    db.run(`INSERT INTO members (name, phone, status) VALUES ('Rahul', '919876543210', 'Pending')`);
});

db.close();