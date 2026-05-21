// Edge Function: delete-self
//
// Deletes the authenticated caller's own Supabase Auth user.
//
// Why this function exists: `supabase.auth.signInWithOAuth({ provider: "google" })`
// has no "sign in only" mode — Supabase silently creates a new user if one
// doesn't exist for the OAuth identity. When the user clicked the Google button
// on the Login page (not Register), we want to tell them "no Spinefit account"
// and leave nothing behind on Supabase. The web client calls this function
// immediately after detecting a freshly-created OAuth user on a login intent.
//
// Security:
//   - JWT verification is on (Supabase default). The Authorization header must
//     carry a valid session token. Anonymous calls are rejected before this
//     code runs.
//   - We re-derive the user id from the token via `getUser()` and pass that to
//     `admin.deleteUser()`. The caller cannot specify a different uid; they can
//     only ever delete themselves.
//   - The service role key is read from the auto-injected `SUPABASE_SERVICE_ROLE_KEY`
//     env var and never leaves the Edge Function runtime.
//
// Deploy:
//   supabase functions deploy delete-self
//
// Local invocation (for testing):
//   curl -X POST \
//     -H "Authorization: Bearer <user_access_token>" \
//     "https://<project-ref>.supabase.co/functions/v1/delete-self"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) {
    return jsonResponse({ error: "missing_authorization" }, 401);
  }
  const accessToken = authHeader.slice("Bearer ".length).trim();

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "missing_env" }, 500);
  }

  // Identify the caller using the anon client + their access token. We never
  // trust a uid the caller might pass in the body — we derive it from the JWT.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse({ error: "invalid_session" }, 401);
  }
  const userId = userData.user.id;

  // Now use the service role to delete that user. RLS doesn't apply to auth
  // admin operations; this requires the service role key.
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: delErr } = await adminClient.auth.admin.deleteUser(userId);
  if (delErr) {
    return jsonResponse({ error: "delete_failed", detail: delErr.message }, 500);
  }

  return jsonResponse({ ok: true }, 200);
});