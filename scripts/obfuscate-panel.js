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
    controlFlowFlatteningThreshold: 0.4,
    numbersToExpressions: true,
    simplify: true,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 0.5,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.75,
    splitStrings: true,
    splitStringsChunkLength: 10,
    transformObjectKeys: true,
    selfDefending: false,
    deadCodeInjection: false,
    disableConsoleOutput: false,
  });

  fs.writeFileSync(panelJsPath, obfuscated.getObfuscatedCode(), 'utf8');
  console.log('[obfuscator] Successfully obfuscated panel/js/panel.js');
}
