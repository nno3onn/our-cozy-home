import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
if (!existsSync(join(dist, 'index.html'))) throw new Error('web export is missing dist/index.html');
const collectFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? collectFiles(join(directory, entry.name)) : [join(directory, entry.name)],
);
const files = collectFiles(dist).filter((file) => /\.(html|js|json|map)$/u.test(file));
const indexHtml = readFileSync(join(dist, 'index.html'), 'utf8');
const vercel = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8'));
if (vercel.buildCommand !== 'npm run build:web') throw new Error('vercel build command must export the Expo web app');
if (vercel.outputDirectory !== 'dist') throw new Error('vercel output directory must be dist');
if (vercel.rewrites?.[0]?.destination !== '/index.html') throw new Error('vercel SPA rewrite is missing');
for (const value of [
  'og:title',
  'og:description',
  'og:image',
  'twitter:card',
  'og-image.png',
  '<link rel="canonical" href="https://our-cozy-home-eight.vercel.app"',
  '<meta property="og:url" content="https://our-cozy-home-eight.vercel.app"',
]) {
  if (!indexHtml.includes(value)) throw new Error(`web export is missing ${value}`);
}
const forbidden = ['SUPABASE_SERVICE_ROLE_KEY', 'NOTIFICATION_WORKER_SECRET', 'ACCOUNT_DELETION_WORKER_SECRET'];
for (const file of files) {
  const contents = readFileSync(file, 'utf8');
  for (const secret of forbidden) if (contents.includes(secret)) throw new Error(`web export contains forbidden secret name: ${secret}`);
}
console.log(`Web export has an SPA entrypoint, rewrite, and no server-secret names in ${files.length} files.`);
