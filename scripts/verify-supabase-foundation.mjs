import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const scriptDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)));
const repositoryRoot = resolve(scriptDirectory, '..');
const requiredPaths = [
  'supabase/config.toml',
  'supabase/migrations',
  'supabase/seed.sql',
  'supabase/tests/000_foundation_test.sql',
];

const requiredPackageScripts = [
  'supabase:start',
  'supabase:stop',
  'supabase:status',
  'supabase:db:reset',
  'supabase:test',
  'supabase:types',
  'supabase:types:local',
];

const missingPaths = requiredPaths.filter(
  (path) => !existsSync(resolve(repositoryRoot, path)),
);

if (missingPaths.length > 0) {
  throw new Error(`Missing Supabase foundation paths: ${missingPaths.join(', ')}`);
}

const packageJson = JSON.parse(
  readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'),
);
const missingScripts = requiredPackageScripts.filter(
  (name) => typeof packageJson.scripts?.[name] !== 'string',
);

if (missingScripts.length > 0) {
  throw new Error(`Missing Supabase npm scripts: ${missingScripts.join(', ')}`);
}

if (typeof packageJson.devDependencies?.supabase !== 'string') {
  throw new Error('Supabase CLI must be pinned in devDependencies.');
}

const config = readFileSync(resolve(repositoryRoot, 'supabase/config.toml'), 'utf8');
if (!/^project_id\s*=\s*"our-cozy-home"$/m.test(config)) {
  throw new Error('supabase/config.toml must declare project_id = "our-cozy-home".');
}

if (!/^major_version\s*=\s*15$/m.test(config)) {
  throw new Error('supabase/config.toml must use PostgreSQL major version 15.');
}

if (!/^port\s*=\s*54324$/m.test(config)) {
  throw new Error('supabase/config.toml must configure the local Inbucket port.');
}

if (!/schemas\s*=\s*\["public", "storage", "graphql_public"\]/.test(config)) {
  throw new Error('supabase/config.toml must expose the required local API schemas.');
}

const environmentExample = readFileSync(resolve(repositoryRoot, '.env.example'), 'utf8');
for (const variable of [
  'EXPO_PUBLIC_APP_MODE',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
]) {
  if (!environmentExample.includes(variable)) {
    throw new Error(`.env.example must document ${variable}.`);
  }
}

const databaseTypes = readFileSync(
  resolve(repositoryRoot, 'src/types/database.generated.ts'),
  'utf8',
);
if (databaseTypes.includes('Record<string, never>')) {
  throw new Error('Database types are still the empty placeholder.');
}

for (const tableName of [
  'app_settings',
  'profiles',
  'houses',
  'house_memberships',
  'animals',
]) {
  if (!new RegExp(`\\b${tableName}:\\s*\\{`).test(databaseTypes)) {
    throw new Error(`Generated database types are missing ${tableName}.`);
  }
}

console.log('Supabase foundation files and commands are present.');
