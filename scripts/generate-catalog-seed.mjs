import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');

function loadTypeScriptModule(relativePath) {
  const sourcePath = resolve(repositoryRoot, relativePath);
  const source = readFileSync(sourcePath, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: sourcePath,
  }).outputText;
  const module = { exports: {} };
  new Function('exports', 'module', output)(module.exports, module);
  return module.exports;
}

const { ITEM_CATALOG } = loadTypeScriptModule('src/catalog/items.ts');
const { renderCatalogSeed } = loadTypeScriptModule('src/catalog/catalogSeed.ts');
const outputPath = resolve(repositoryRoot, 'supabase/seed/001_item_definitions.sql');

writeFileSync(outputPath, renderCatalogSeed(ITEM_CATALOG));
console.log(`generated ${outputPath}`);
