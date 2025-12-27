#!/usr/bin/env node

/**
 * Migrare Date de Test către Application Support
 * 
 * Acest script copiază datele de test din folderul local ./Stocare
 * către directorul de date al aplicației pe Mac:
 * ~/Library/Application Support/curentu-app/Stocare/
 * 
 * Utilizare:
 *   node migrate-test-data.mjs
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Căile
const sourceDir = join(__dirname, 'Stocare');
const targetDir = join(homedir(), 'Library', 'Application Support', 'curentu-app', 'Stocare');

console.log('📦 MIGRARE DATE DE TEST');
console.log('========================');
console.log(`Sursă:  ${sourceDir}`);
console.log(`Țintă:  ${targetDir}`);
console.log('');

// Verificare sursă
if (!existsSync(sourceDir)) {
    console.error('❌ Eroare: Folderul sursă ./Stocare nu există!');
    process.exit(1);
}

// Creare director țintă
if (!existsSync(targetDir)) {
    console.log('📁 Creez directorul țintă...');
    mkdirSync(targetDir, { recursive: true });
}

// Copiere fișiere .json
const files = readdirSync(sourceDir).filter(f => f.endsWith('.json'));

if (files.length === 0) {
    console.warn('⚠️ Nu am găsit fișiere .json pentru copiere!');
    process.exit(0);
}

console.log(`📋 Găsite ${files.length} fișiere JSON:\n`);

let copiedCount = 0;
let errorCount = 0;

files.forEach(file => {
    const sourcePath = join(sourceDir, file);
    const targetPath = join(targetDir, file);

    try {
        copyFileSync(sourcePath, targetPath);
        console.log(`  ✅ ${file}`);
        copiedCount++;
    } catch (err) {
        console.error(`  ❌ ${file} - Eroare: ${err.message}`);
        errorCount++;
    }
});

console.log('');
console.log('========================');
console.log(`✨ Finalizat!`);
console.log(`   Copiate: ${copiedCount}`);
if (errorCount > 0) {
    console.log(`   Erori:   ${errorCount}`);
}
console.log('');
console.log('💡 Acum poți porni aplicația și datele vor fi disponibile!');
