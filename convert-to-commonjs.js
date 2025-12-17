const fs = require('fs-extra');
const path = require('path');

// Script pentru a converti automat ES modules la CommonJS pentru Electron
async function convertESModulesToCommonJS() {
  console.log('🔄 Starting conversion from ES modules to CommonJS...');
  
  const stocareDir = 'Stocare';
  const outputDir = 'Stocare-electron';
  
  // Crează directorul de output
  await fs.ensureDir(outputDir);
  
  // Copiază toate fișierele JSON (nu necesită conversie)
  const jsonFiles = await fs.readdir(stocareDir);
  for (const file of jsonFiles) {
    if (file.endsWith('.json')) {
      await fs.copy(path.join(stocareDir, file), path.join(outputDir, file));
      console.log(`✅ Copied ${file}`);
    }
  }
  
  // Convertește fișierele .js
  const jsFiles = jsonFiles.filter(file => file.endsWith('.js'));
  
  for (const file of jsFiles) {
    console.log(`🔄 Converting ${file}...`);
    
    const filePath = path.join(stocareDir, file);
    const outputPath = path.join(outputDir, file);
    
    let content = await fs.readFile(filePath, 'utf8');
    
    // Convertește import statements
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"];?/g, (match, imports, modulePath) => {
      const cleanImports = imports.split(',').map(imp => imp.trim()).join(', ');
      // Ajustează calea pentru module locale
      const adjustedPath = modulePath.startsWith('./') ? modulePath : modulePath;
      return `const { ${cleanImports} } = require('${adjustedPath}');`;
    });
    
    content = content.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g, (match, defaultImport, modulePath) => {
      return `const ${defaultImport} = require('${modulePath}');`;
    });
    
    // Convertește export statements
    content = content.replace(/export\s+{([^}]+)};?/g, (match, exports) => {
      const exportList = exports.split(',').map(exp => exp.trim());
      return `module.exports = { ${exportList.join(', ')} };`;
    });
    
    content = content.replace(/export\s+const\s+(\w+)/g, 'const $1');
    content = content.replace(/export\s+function\s+(\w+)/g, 'function $1');
    content = content.replace(/export\s+async\s+function\s+(\w+)/g, 'async function $1');
    
    // Adaugă module.exports la sfârșitul fișierului dacă nu există
    if (!content.includes('module.exports') && content.includes('export')) {
      // Extrage numele funcțiilor exportate
      const functionMatches = content.match(/^(async\s+)?function\s+(\w+)/gm) || [];
      const constMatches = content.match(/^const\s+(\w+)\s*=/gm) || [];
      
      const functions = functionMatches.map(match => {
        const parts = match.split(/\s+/);
        return parts[parts.length - 1];
      });
      
      const constants = constMatches.map(match => {
        return match.match(/const\s+(\w+)/)[1];
      });
      
      const allExports = [...functions, ...constants];
      
      if (allExports.length > 0) {
        content += `\n\nmodule.exports = {\n  ${allExports.join(',\n  ')}\n};\n`;
      }
    }
    
    await fs.writeFile(outputPath, content, 'utf8');
    console.log(`✅ Converted ${file}`);
  }
  
  console.log('✅ Conversion completed! Check the Stocare-electron directory.');
  console.log('📋 Next steps:');
  console.log('1. Review converted files for any manual adjustments needed');
  console.log('2. Update server-electron.js to use ./Stocare-electron/ paths');
  console.log('3. Test the conversion with npm run electron-dev');
}

// Pentru server-electron.js, creează versiune cu căi corecte
async function createServerElectron() {
  console.log('📝 Creating server-electron.js with correct paths...');
  
  const serverContent = `const express = require('express');
const cors = require('cors');
const path = require('path');

// Import-urile adaptate pentru CommonJS
const {
  getMateriiPrime,
  adaugaSauSuplimenteazaMaterial,
  actualizeazaMaterial,
  stergeMaterial,
  stergeToateMaterialele,
} = require('./Stocare-electron/ingrediente.js');

const { getFermentatoare, updateFermentator } = require('./Stocare-electron/fermentatoare.js');

const {
  adaugaLot,
  obtineLoturi,
  actualizeazaLot,
  stergeLot,
  obtineLotDupaId,
} = require('./Stocare-electron/loturiAmbalate.js');

const {
  getMaterialeAmbalare,
  adaugaMaterialAmbalare,
  actualizeazaMaterialAmbalare,
  stergeMaterialAmbalare,
  stergeToateMaterialeleAmbalare,
  exportaMaterialeAmbalare,
  getMaterialePentruLot,
} = require('./Stocare-electron/materialeAmbalare.js');

const { getReteteBere } = require('./Stocare-electron/reteteBere.js');

const {
  getIesiriBere,
  adaugaIesireBere,
  getIesiriPentruLot,
  getSumarIesiriPeRetete,
  getStatisticiIesiri,
  stergeIesireBere,
  exportaIesiriCSV,
  getIesiriPerioada,
} = require('./Stocare-electron/iesiriBere.js');

function createExpressServer(port = 3001) {
  const app = express();
  
  app.use(cors());
  app.use('/static', express.static(path.join(__dirname, 'Stocare-electron')));
  app.use(express.json());

  // Restul codului serverului rămâne la fel...
  // [Aici ar fi tot conținutul din server.js adaptat]
  
  return app;
}

module.exports = createExpressServer;`;

  await fs.writeFile('server-electron.js', serverContent);
  console.log('✅ server-electron.js created!');
}

if (require.main === module) {
  convertESModulesToCommonJS().then(() => {
    console.log('🎉 All conversions completed successfully!');
  }).catch(error => {
    console.error('❌ Error during conversion:', error);
  });
}

module.exports = { convertESModulesToCommonJS, createServerElectron };