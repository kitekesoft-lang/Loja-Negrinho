/**
 * Kiteke Pro Desktop - Script de Empacotamento Windows Portable (Codespace / Linux / CI)
 *
 * Funciona nativamente em GitHub Codespaces e qualquer ambiente Linux/macOS/Windows sem precisar de Wine.
 * Extrai os binários oficiais do Electron 22.3.27 (suporte nativo a Windows 7 SP1 / 8 / 8.1 / 10 / 11),
 * empacota a aplicação com @electron/asar, personaliza o executável "Kiteke Pro.exe"
 * e gera os arquivos .zip e as pastas desempacotadas para distribuição.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { execSync } = require('child_process');
const asar = require('@electron/asar');
const sevenZaBin = require('7zip-bin').path7za;

const ELECTRON_VERSION = '22.3.27';
const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');
const publicDownloadsDir = path.join(rootDir, 'public', 'downloads');

// Função para descarregar ficheiros caso não estejam na cache local
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    console.log(`[Download] A descarregar de: ${url}`);

    function get(currentUrl) {
      https.get(currentUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          return get(response.headers.location);
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.rmSync(destPath, { force: true });
          return reject(new Error(`Falha no download (HTTP ${response.statusCode})`));
        }

        const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedBytes = 0;
        let lastLogged = 0;

        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const now = Date.now();
          if (now - lastLogged > 2000 && totalBytes > 0) {
            const pct = ((downloadedBytes / totalBytes) * 100).toFixed(1);
            console.log(`[Download] Progresso: ${pct}% (${(downloadedBytes / 1048576).toFixed(1)} MB / ${(totalBytes / 1048576).toFixed(1)} MB)`);
            lastLogged = now;
          }
        });

        response.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            console.log(`[Download] Concluído com sucesso!`);
            resolve();
          });
        });
      }).on('error', (err) => {
        file.close();
        fs.rmSync(destPath, { force: true });
        reject(err);
      });
    }

    get(url);
  });
}

// Localizar ou descarregar o zip do Electron para uma dada arquitetura
async function getElectronZip(arch) {
  const fileName = `electron-v${ELECTRON_VERSION}-win32-${arch}.zip`;
  const possiblePaths = [
    path.join(os.homedir(), '.cache', 'electron', fileName),
    path.join('/root/.cache/electron', fileName),
    path.join(releaseDir, 'cache', fileName),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).size > 10000000) {
      console.log(`[Cache] Utilizando binário pré-existente: ${p}`);
      return p;
    }
  }

  // Se não existir na cache local, descarregar para a pasta release/cache
  const cacheDir = path.join(releaseDir, 'cache');
  fs.mkdirSync(cacheDir, { recursive: true });
  const targetZip = path.join(cacheDir, fileName);

  const downloadUrl = `https://github.com/electron/electron/releases/download/v${ELECTRON_VERSION}/${fileName}`;
  await downloadFile(downloadUrl, targetZip);
  return targetZip;
}

async function packageArchitecture(arch) {
  const is64 = arch === 'x64';
  const archLabel = is64 ? '64-bit (x64)' : '32-bit (ia32 / x86)';
  console.log(`\n=======================================================`);
  console.log(`Empacotando Kiteke Pro Desktop para Windows ${archLabel}`);
  console.log(`Compatibilidade: Windows 7 SP1, Windows 8, 8.1, 10 e 11`);
  console.log(`=======================================================`);

  const unpackedDir = path.join(releaseDir, is64 ? 'win-unpacked' : 'win-ia32-unpacked');
  fs.rmSync(unpackedDir, { recursive: true, force: true });
  fs.mkdirSync(unpackedDir, { recursive: true });

  // 1. Obter e Extrair binários oficiais
  const electronZip = await getElectronZip(arch);
  console.log(`1. A extrair binários oficiais do Electron ${ELECTRON_VERSION} (${arch})...`);
  execSync(`"${sevenZaBin}" x "${electronZip}" -o"${unpackedDir}" -y`, { stdio: 'ignore' });

  // 2. Renomear electron.exe para "Kiteke Pro.exe"
  const defaultExe = path.join(unpackedDir, 'electron.exe');
  const targetExe = path.join(unpackedDir, 'Kiteke Pro.exe');
  if (fs.existsSync(defaultExe)) {
    fs.renameSync(defaultExe, targetExe);
    console.log('2. Executável principal nomeado para: "Kiteke Pro.exe"');
  }

  // 3. Preparar staging para app.asar
  console.log('3. Preparando ficheiros da aplicação (Frontend Vite + Shell Electron)...');
  const stagingDir = path.join(releaseDir, `staging-${arch}`);
  fs.rmSync(stagingDir, { recursive: true, force: true });
  fs.mkdirSync(stagingDir, { recursive: true });

  fs.cpSync(path.join(rootDir, 'dist'), path.join(stagingDir, 'dist'), { recursive: true });
  fs.cpSync(path.join(rootDir, 'electron'), path.join(stagingDir, 'electron'), { recursive: true });

  // package.json enxuto para o Electron
  const runtimePkg = {
    name: 'kitekepro',
    productName: 'Kiteke Pro',
    version: '1.0.0',
    description: 'Kiteke Pro — Sistema de Gestão Empresarial e Faturação Certificada',
    main: 'electron/main/main.cjs',
    author: 'KitekeSoft',
  };
  fs.writeFileSync(path.join(stagingDir, 'package.json'), JSON.stringify(runtimePkg, null, 2));

  // 4. Empacotar app.asar com @electron/asar
  console.log('4. A consolidar pacote protegido app.asar...');
  const resourcesDir = path.join(unpackedDir, 'resources');
  fs.mkdirSync(resourcesDir, { recursive: true });
  const defaultAsar = path.join(resourcesDir, 'default_app.asar');
  if (fs.existsSync(defaultAsar)) fs.rmSync(defaultAsar);

  const targetAsar = path.join(resourcesDir, 'app.asar');
  await asar.createPackage(stagingDir, targetAsar);
  fs.rmSync(stagingDir, { recursive: true, force: true });

  // 5. Adicionar guia LEIA-ME
  const readmeContent = `=======================================================
KITEKE PRO — SISTEMA DE GESTÃO EMPRESARIAL & FACTURAÇÃO
Versão: 1.0.0 Desktop Windows (${archLabel})
Motor: Electron ${ELECTRON_VERSION} (Chromium 108)
=======================================================

COMPATIBILIDADE GARANTIDA:
• Windows 7 SP1 (32-bit e 64-bit com KB2533623)
• Windows 8 e Windows 8.1
• Windows 10 e Windows 11
• Windows Server 2008 R2 / 2012 / 2016 / 2019 / 2022

INSTRUÇÕES DE EXECUÇÃO:
1. Extraia o conteúdo deste arquivo para uma pasta local (Exemplo: C:\\KitekePro).
2. Dê duplo clique no executável "Kiteke Pro.exe" para iniciar o sistema.
3. Se desejar, crie um atalho de "Kiteke Pro.exe" no seu Ambiente de Trabalho.

Contactos & Suporte:
KitekeSoft — Suporte Técnico
Email: kitekesoft@gmail.com
`;
  fs.writeFileSync(path.join(unpackedDir, 'LEIA-ME.txt'), readmeContent);

  // 6. Criar ZIP de distribuição
  const zipName = `Kiteke-Pro-Portable-${arch}.zip`;
  const zipPath = path.join(releaseDir, zipName);
  const publicZipPath = path.join(publicDownloadsDir, zipName);

  if (fs.existsSync(zipPath)) fs.rmSync(zipPath);
  console.log(`5. Criando arquivo comprimido ${zipName}...`);
  execSync(`"${sevenZaBin}" a -tzip "${zipPath}" "${unpackedDir}/*"`, { stdio: 'ignore' });

  // Disponibilizar para download no navegador
  fs.copyFileSync(zipPath, publicZipPath);
  console.log(`✓ Pacote ${zipName} concluído com sucesso!`);
}

async function main() {
  console.log('--- INICIANDO EMPACOTAMENTO KITEKE PRO DESKTOP WINDOWS ---');

  // Assegurar que o Vite build está pronto
  if (!fs.existsSync(path.join(rootDir, 'dist', 'index.html'))) {
    console.log('A compilar frontend Vite para dist/...');
    execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
  }

  fs.mkdirSync(releaseDir, { recursive: true });
  fs.mkdirSync(publicDownloadsDir, { recursive: true });

  const args = process.argv.slice(2);
  const shouldBuild32 = args.includes('--ia32') || args.includes('--all') || args.includes('--win:x86');
  const shouldBuild64 = args.includes('--x64') || args.includes('--all') || (!shouldBuild32 && !args.includes('--ia32'));

  if (shouldBuild64) {
    await packageArchitecture('x64');
  }
  if (shouldBuild32) {
    await packageArchitecture('ia32');
  }

  console.log('\n=======================================================');
  console.log('RESUMO DO EMPACOTAMENTO DESKTOP:');
  console.log('=======================================================');
  const files = fs.readdirSync(releaseDir).filter((f) => f.endsWith('.zip') || f.endsWith('.exe'));
  files.forEach((f) => {
    const sizeMb = (fs.statSync(path.join(releaseDir, f)).size / 1048576).toFixed(1);
    console.log(`• ${f} (${sizeMb} MB)`);
  });
  console.log('Executáveis prontos na pasta release/ e /public/downloads/');
}

main().catch((err) => {
  console.error('\n[ERRO CRÍTICO NO EMPACOTAMENTO]:', err.message);
  process.exit(1);
});
