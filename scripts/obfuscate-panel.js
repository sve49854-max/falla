import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JavaScriptObfuscator from 'javascript-obfuscator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const panelJsPath = path.join(__dirname, '..', 'panel', 'js', 'panel.js');
const panelSrcPath = path.join(__dirname, '..', 'panel', 'js', 'panel.src.js');

if (fs.existsSync(panelJsPath)) {
  // If panel.src.js does not exist yet, backup the original panel.js
  if (!fs.existsSync(panelSrcPath)) {
    fs.copyFileSync(panelJsPath, panelSrcPath);
    console.log('[obfuscator] Backed up original panel.js to panel.src.js');
  }

  const sourceCode = fs.readFileSync(panelSrcPath, 'utf8');
  const obfuscated = JavaScriptObfuscator.obfuscate(sourceCode, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    stringArray: true,
    stringArrayEncoding: ['base64', 'rc4'],
    stringArrayThreshold: 0.8,
    splitStrings: true,
    splitStringsChunkLength: 8,
    selfDefending: true,
    disableConsoleOutput: false,
  });

  fs.writeFileSync(panelJsPath, obfuscated.getObfuscatedCode(), 'utf8');
  console.log('[obfuscator] Successfully obfuscated panel/js/panel.js');
}
