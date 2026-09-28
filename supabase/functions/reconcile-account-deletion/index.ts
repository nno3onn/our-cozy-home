import { createClient } from 'npm:@supabase/supabase-js@2';

function response(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

Deno.serve(async (request) => {
  const secret = Deno.env.get('ACCOUNT_DELETION_WORKER_SECRET');
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || !url || !serviceRoleKey || request.headers.get('x-account-deletion-worker-secret') !== secret) {
    return response({ error: 'unauthorized' }, 401);
  }
  const { profileId } = await request.json().catch(() => ({}));
  if (typeof profileId !== 'string') return response({ error: 'profile_id_required' }, 400);

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: requestRow, error: requestError } = await admin
    .from('account_deletion_requests').select('status').eq('profile_id', profileId).maybeSingle<{ status: string }>();
  if (requestError || !requestRow) return response({ error: 'deletion_not_prepared' }, 409);
  if (requestRow.status === 'completed') return response({ status: 'completed' });

  const { data: existingUser, error: userError } = await admin.auth.admin.getUserById(profileId);
  if (!userError && existingUser.user) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(profileId);
    if (deleteError) return response({ error: 'auth_deletion_failed' }, 500);
  }
  const { error: completionError } = await admin.rpc('mark_account_deletion_completed', { p_profile_id: profileId });
  if (completionError) return response({ error: 'completion_record_failed' }, 500);
  return response({ status: 'completed' });
});
