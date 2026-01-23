const fs = require('fs');
const path = require('path');

// Identify DB path
// Assuming this runs from root
const dbPath = path.join(__dirname, '..', 'Stocare', 'db.json');
const backupPath = path.join(__dirname, '..', 'Stocare', 'backups');

if (!fs.existsSync(dbPath)) {
    console.error(`[SANITIZE] DB not found at ${dbPath}`);
    process.exit(1);
}

// Backup first
if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
}
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.copyFileSync(dbPath, path.join(backupPath, `db-presanitize-${timestamp}.json`));
console.log(`[SANITIZE] Backup created.`);

// Read DB
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Sanitize Logic
console.log(`[SANITIZE] Cleaning data...`);

// 1. Reset Stoc Materiale -> 0
if (data.stocMateriale) {
    data.stocMateriale = data.stocMateriale.map(item => ({
        ...item,
        cantitate: 0
    }));
}

// 2. Reset Fermentatoare -> Empty
if (data.fermentatoare) {
    data.fermentatoare = data.fermentatoare.map(fer => ({
        ...fer,
        ocupat: false,
        reteta: null,
        cantitate: 0,
        dataInceput: null
    }));
}

// 3. Clear History
data.loturiAmbalate = [];
data.iesiriBere = [];
data.rebuturi = [];

// Save
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
console.log(`[SANITIZE] Database successfully broken down to ZERO (Sanitized).`);
