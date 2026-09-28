import { createClient } from 'npm:@supabase/supabase-js@2';

type DeletionRequest = { status: 'ready_for_auth_deletion' | 'completed' };

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = request.headers.get('authorization');
  if (!url || !anonKey || !serviceRoleKey || !authorization) return json({ error: 'unauthorized' }, 401);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: 'unauthorized' }, 401);

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: deletionRequest, error: requestError } = await admin
    .from('account_deletion_requests')
    .select('status')
    .eq('profile_id', userData.user.id)
    .maybeSingle<DeletionRequest>();
  if (requestError || !deletionRequest) return json({ error: 'deletion_not_prepared' }, 409);
  if (deletionRequest.status === 'completed') return json({ status: 'completed' });

  // Storage object paths are not returned to the app and are removed before the
  // Auth identity is deleted. Retrying the function safely removes any paths
  // that remain from a partial previous invocation.
  const { data: photoRows, error: photoError } = await admin
    .from('memory_photos')
    .select('storage_path,memory_contributions!inner(author_profile_id)')
    .eq('memory_contributions.author_profile_id', userData.user.id);
  if (photoError) return json({ error: 'photo_lookup_failed' }, 500);
  const paths = (photoRows ?? []).map((row) => row.storage_path).filter(Boolean);
  if (paths.length > 0) {
    const { error: storageError } = await admin.storage.from('memory-photos').remove(paths);
    if (storageError) return json({ error: 'photo_removal_failed' }, 500);
  }

  const { error: deletionError } = await admin.auth.admin.deleteUser(userData.user.id);
  if (deletionError) return json({ error: 'auth_deletion_failed' }, 500);
  const { error: completionError } = await admin.rpc('mark_account_deletion_completed', { p_profile_id: userData.user.id });
  if (completionError) return json({ error: 'completion_record_failed' }, 500);
  return json({ status: 'completed' });
});
