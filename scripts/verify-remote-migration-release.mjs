import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const scriptDirectory = resolve(fileURLToPath(new URL('.', import.meta.url)));
const repositoryRoot = resolve(scriptDirectory, '..');
const workflowPath = resolve(
  repositoryRoot,
  '.github/workflows/apply-remote-supabase-migrations.yml',
);

if (!existsSync(workflowPath)) {
  throw new Error('Missing the manual remote Supabase migration workflow.');
}

const workflow = readFileSync(workflowPath, 'utf8');
const requiredFragments = [
  'name: Apply remote Supabase migrations',
  'workflow_dispatch:',
  'confirm:',
  "inputs.confirm == 'APPLY-MIGRATIONS'",
  'supabase/setup-cli@v1',
  'version: 2.118.0',
  'SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}',
  'SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}',
  'supabase link --project-ref cbyikdryogktctskvzzk --password "$SUPABASE_DB_PASSWORD"',
  'supabase db push',
  'supabase db push --dry-run',
  'supabase test db --linked supabase/tests/017_catalog_publish_test.sql',
];

for (const fragment of requiredFragments) {
  if (!workflow.includes(fragment)) {
    throw new Error(`Remote migration workflow is missing: ${fragment}`);
  }
}

for (const forbiddenTrigger of ['  push:', '  pull_request:']) {
  if (workflow.includes(forbiddenTrigger)) {
    throw new Error(`Remote migration workflow must not run automatically (${forbiddenTrigger.trim()}).`);
  }
}

for (const unsafeOutput of ['echo "$SUPABASE_ACCESS_TOKEN"', 'echo "$SUPABASE_DB_PASSWORD"']) {
  if (workflow.includes(unsafeOutput)) {
    throw new Error('Remote migration workflow must not print a deployment secret.');
  }
}

console.log('Manual remote Supabase migration workflow contract is present.');
