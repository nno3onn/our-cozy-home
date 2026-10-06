import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const DEFAULT_PROJECT_REF = 'cbyikdryogktctskvzzk';
const EDGE_FUNCTIONS = ['send-push', 'delete-account', 'reconcile-account-deletion'];
const WORKERS = {
  'send-push': {
    headerName: 'x-notification-worker-secret',
    secretName: 'NOTIFICATION_WORKER_SECRET',
  },
  'reconcile-account-deletion': {
    headerName: 'x-account-deletion-worker-secret',
    secretName: 'ACCOUNT_DELETION_WORKER_SECRET',
  },
};

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code ?? 'unknown'}`));
    });
  });
}

export async function deployFunctions({ projectRef = DEFAULT_PROJECT_REF, run = runCommand } = {}) {
  for (const functionName of EDGE_FUNCTIONS) {
    await run('supabase', [
      'functions',
      'deploy',
      functionName,
      '--project-ref',
      projectRef,
    ]);
  }
}

export function resolveWorkerRequest(workerName, env = process.env, projectRef = DEFAULT_PROJECT_REF) {
  const worker = WORKERS[workerName];
  if (!worker) {
    throw new Error(`Unsupported worker: ${workerName}`);
  }

  const secret = env[worker.secretName];
  if (!secret) {
    throw new Error(`${worker.secretName} is required.`);
  }

  const request = {
    url: `https://${projectRef}.supabase.co/functions/v1/${workerName}`,
    options: {
      method: 'POST',
      headers: { [worker.headerName]: secret },
    },
  };

  if (workerName === 'reconcile-account-deletion') {
    const profileId = env.ACCOUNT_DELETION_PROFILE_ID;
    if (!profileId) {
      throw new Error('ACCOUNT_DELETION_PROFILE_ID is required.');
    }
    request.options.headers['content-type'] = 'application/json';
    request.options.body = JSON.stringify({ profileId });
  }

  return request;
}

export async function invokeWorker({
  workerName,
  env = process.env,
  fetchImpl = fetch,
  projectRef = DEFAULT_PROJECT_REF,
}) {
  const request = resolveWorkerRequest(workerName, env, projectRef);
  const response = await fetchImpl(request.url, request.options);
  if (!response.ok) {
    throw new Error(`${workerName} returned HTTP ${response.status}.`);
  }
  return response.status;
}

async function main() {
  const [command, workerName] = process.argv.slice(2);
  const projectRef = process.env.SUPABASE_PROJECT_REF || DEFAULT_PROJECT_REF;

  if (command === 'deploy') {
    await deployFunctions({ projectRef });
    console.log(`Deployed ${EDGE_FUNCTIONS.length} Edge Functions.`);
    return;
  }

  if (command === 'invoke' && workerName) {
    const status = await invokeWorker({ workerName, projectRef });
    console.log(`${workerName} completed with HTTP ${status}.`);
    return;
  }

  throw new Error('Usage: node scripts/supabase-edge-release.mjs <deploy|invoke WORKER_NAME>');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
