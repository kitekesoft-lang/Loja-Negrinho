/**
 * Kiteke Pro Desktop - Configurações Gerais
 */
const path = require('path');

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

module.exports = {
  appName: 'Kiteke Pro',
  version: '1.0.0',
  appId: 'ao.kitekesoft.kitekepro',
  isDev,
  electronVersion: '22.3.27',
  targetPlatform: 'win32',
  compatibility: {
    legacy: ['Windows 7', 'Windows 8', 'Windows 8.1'],
    modern: ['Windows 10', 'Windows 11'],
  },
  window: {
    title: 'Kiteke Pro — Sistema de Gestão Empresarial',
    minWidth: 1024,
    minHeight: 700,
    defaultWidth: 1366,
    defaultHeight: 820,
    backgroundColor: '#061224',
  },
  paths: {
    iconPng: path.join(__dirname, '../assets/icon.png'),
    preload: path.join(__dirname, '../preload/preload.cjs'),
    rendererDist: path.join(__dirname, '../../dist/index.html'),
  },
};
