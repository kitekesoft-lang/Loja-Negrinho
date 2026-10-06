/**
 * Kiteke Pro Desktop - Script de Empacotamento Windows Portable
 * Extrai o binário oficial do Electron 22.3.27, empacota o app.asar com asar nativo,
 * personaliza o executável "Kiteke Pro.exe" e gera o arquivo .zip de distribuição.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');
const winUnpackedDir = path.join(releaseDir, 'win-unpacked');
const publicDownloadsDir = path.join(rootDir, 'public', 'downloads');
const electronZip = '/root/.cache/electron/electron-v22.3.27-win32-x64.zip';
const sevenZaBin = path.join(rootDir, 'node_modules', '7zip-bin', 'linux', 'x64', '7za');
const asarBin = path.join(rootDir, 'node_modules', '.bin', 'asar');

console.log('--- INICIANDO EMPACOTAMENTO KITEKE PRO DESKTOP (WINDOWS x64) ---');

// Assegurar que o Vite dist existe
if (!fs.existsSync(path.join(rootDir, 'dist'))) {
  console.log('Compilando frontend Vite para dist/...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
}

// 1. Criar diretórios
fs.mkdirSync(releaseDir, { recursive: true });
fs.mkdirSync(publicDownloadsDir, { recursive: true });
fs.rmSync(winUnpackedDir, { recursive: true, force: true });
fs.mkdirSync(winUnpackedDir, { recursive: true });

// 2. Extrair binários do Electron 22.3.27
console.log('1. Extraindo binários oficiais do Electron 22.3.27 para win-unpacked...');
execSync(`"${sevenZaBin}" x "${electronZip}" -o"${winUnpackedDir}" -y`, { stdio: 'inherit' });

// 3. Renomear electron.exe para "Kiteke Pro.exe"
const defaultExe = path.join(winUnpackedDir, 'electron.exe');
const targetExe = path.join(winUnpackedDir, 'Kiteke Pro.exe');
if (fs.existsSync(defaultExe)) {
  fs.renameSync(defaultExe, targetExe);
  console.log('2. Executável renomeado para "Kiteke Pro.exe".');
}

// 4. Preparar pasta temporária para app.asar
console.log('3. Preparando ficheiros da aplicação (Vite dist + Electron Shell)...');
const stagingDir = path.join(rootDir, 'build-staging');
fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(stagingDir, { recursive: true });

// Copiar dist
fs.cpSync(path.join(rootDir, 'dist'), path.join(stagingDir, 'dist'), { recursive: true });
// Copiar electron
fs.cpSync(path.join(rootDir, 'electron'), path.join(stagingDir, 'electron'), { recursive: true });

// Criar package.json limpo para o runtime Electron
const runtimePkg = {
  name: 'kitekepro',
  productName: 'Kiteke Pro',
  version: '1.0.0',
  description: 'Kiteke Pro - Sistema de Gestão Empresarial',
  main: 'electron/main/main.cjs',
  author: 'KitekeSoft',
};
fs.writeFileSync(path.join(stagingDir, 'package.json'), JSON.stringify(runtimePkg, null, 2));

// 5. Compilar app.asar
const resourcesDir = path.join(winUnpackedDir, 'resources');
fs.mkdirSync(resourcesDir, { recursive: true });
const targetAsar = path.join(resourcesDir, 'app.asar');

// Remover default_app.asar se existir
const defaultAsar = path.join(resourcesDir, 'default_app.asar');
if (fs.existsSync(defaultAsar)) {
  fs.rmSync(defaultAsar);
}

console.log('4. Empacotando app.asar...');
execSync(`"${asarBin}" pack "${stagingDir}" "${targetAsar}"`, { stdio: 'inherit' });
fs.rmSync(stagingDir, { recursive: true, force: true });

// 6. Adicionar ficheiro de instrução e inicialização rápida
const readmeTxt = `KITEKE PRO — SISTEMA DE GESTÃO EMPRESARIAL
Versão: 1.0.0 Desktop Windows (Electron 22.3.27)
Compatibilidade: Windows 7 SP1, Windows 8, Windows 8.1, Windows 10 e Windows 11

COMO EXECUTAR:
1. Extraia o conteúdo desta pasta para qualquer directório (ex: C:\\KitekePro ou Ambiente de Trabalho).
2. Dê duplo clique no executável "Kiteke Pro.exe" para iniciar o sistema.
3. Se desejar, crie um atalho de "Kiteke Pro.exe" no seu Ambiente de Trabalho.

Suporte: KitekeSoft (kitekesoft@gmail.com)
`;
fs.writeFileSync(path.join(winUnpackedDir, 'LEIA-ME.txt'), readmeTxt);

// 7. Compactar em arquivo .zip portátil oficial
const zipRelease = path.join(releaseDir, 'Kiteke-Pro-Portable-x64.zip');
const zipPublic = path.join(publicDownloadsDir, 'Kiteke-Pro-Portable-x64.zip');

if (fs.existsSync(zipRelease)) fs.rmSync(zipRelease);
console.log('5. Criando pacote portátil comprimido Kiteke-Pro-Portable-x64.zip...');
execSync(`"${sevenZaBin}" a -tzip "${zipRelease}" "${winUnpackedDir}/*"`, { stdio: 'inherit' });

// Copiar para pasta pública para download direto no navegador
fs.copyFileSync(zipRelease, zipPublic);
console.log('6. Cópia disponibilizada em /public/downloads/Kiteke-Pro-Portable-x64.zip para descarregamento no browser.');

console.log('--- EMPACOTAMENTO CONCLUÍDO COM SUCESSO! ---');
console.log('Executável: release/win-unpacked/Kiteke Pro.exe');
console.log('Arquivo Portátil: release/Kiteke-Pro-Portable-x64.zip');
