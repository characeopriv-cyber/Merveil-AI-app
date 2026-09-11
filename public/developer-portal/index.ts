// Receives OAuth callback, exchanges code → token, stores in integrations table
import { serve } from "https://deno.land/std@0.210.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const provider = url.searchParams.get("provider") || "github";
  if (!code) return new Response("missing code", { status: 400 });

  let access_token = "", refresh_token = null, account_label = "";

  if (provider === "github") {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams({
        client_id: Deno.env.get("GITHUB_CLIENT_ID")!,
        client_secret: Deno.env.get("GITHUB_CLIENT_SECRET")!,
        code,
      }),
    });
    const j = await r.json();
    access_token = j.access_token;

    const u = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${access_token}` },
    }).then(r => r.json());
    account_label = u.login;
  }

  await sb.from("integrations").upsert({
    owner_user_id: req.headers.get("x-user-id"),
    provider,
    account_label,
    access_token_enc: access_token,
    refresh_token_enc: refresh_token,
    status: "connected",
  }, { onConflict: "owner_user_id,provider" });

  return Response.redirect(`${Deno.env.get("APP_URL")}/developer?connected=${provider}`, 302);
});
