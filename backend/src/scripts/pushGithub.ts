import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

const REPO_URL = 'https://github.com/crisflorsims/sistema-academico-ecema.git';

function findGitExecutable(): string {
  const candidates = [
    'C:\\Program Files\\Git\\cmd\\git.exe',
    'C:\\Program Files\\Git\\bin\\git.exe',
    'C:\\Program Files (x86)\\Git\\cmd\\git.exe',
    'C:\\Users\\crist\\AppData\\Local\\Programs\\Git\\cmd\\git.exe',
  ];

  // Buscar también en GitHub Desktop si está instalado
  const ghDesktopDir = 'C:\\Users\\crist\\AppData\\Local\\GitHubDesktop';
  if (fs.existsSync(ghDesktopDir)) {
    const entries = fs.readdirSync(ghDesktopDir);
    for (const entry of entries) {
      if (entry.startsWith('app-')) {
        candidates.push(path.join(ghDesktopDir, entry, 'resources', 'app', 'git', 'cmd', 'git.exe'));
      }
    }
  }

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return `"${c}"`;
    }
  }
  return 'git';
}

const gitCmd = findGitExecutable();
console.log(`Usando ejecutable Git: ${gitCmd}`);

function run(args: string) {
  const fullCmd = `${gitCmd} ${args}`;
  console.log(`> ${fullCmd}`);
  execSync(fullCmd, { cwd: rootDir, stdio: 'inherit' });
}

try {
  run('init');
  try {
    run('remote remove origin');
  } catch {
    // ignore if origin doesn't exist
  }
  run(`remote add origin ${REPO_URL}`);
  run('add .');
  try {
    run('commit -m "Despliegue Sistema Academico ECEMA (DCEA y DCEMA)"');
  } catch {
    console.log('Nada nuevo para commitear o commit ya existente.');
  }
  run('branch -M main');
  run('push -u origin main --force');
  console.log('\n✅ ¡Código subido exitosamente a GitHub!');
} catch (err) {
  console.error('❌ Error al subir a GitHub:', err);
  process.exit(1);
}
