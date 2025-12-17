import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function build() {
  console.log('🚀 Începe procesul de build...');
  
  try {
    console.log('📦 Build React app...');
    await execAsync('npm run build');
    
    console.log('🔧 Build Electron app...');
    await execAsync('npm run electron:dist');
    
    console.log('✅ Build completat cu succes!');
  } catch (error) {
    console.error('❌ Eroare la build:', error);
    process.exit(1);
  }
}

build();