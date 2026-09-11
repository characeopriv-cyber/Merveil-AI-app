// Handles /integrations/connect — returns OAuth URL for a given provider
import { serve } from "https://deno.land/std@0.210.0/http/server.ts";

const PROVIDERS: Record<string, { authUrl: string; clientId: string; scope: string }> = {
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    clientId: Deno.env.get("GITHUB_CLIENT_ID")!,
    scope: "repo workflow user:email",
  },
  vercel: {
    authUrl: "https://vercel.com/integrations/merveil/new",
    clientId: "",
    scope: "",
  },
  supabase: {
    authUrl: "https://api.supabase.com/v1/oauth/authorize",
    clientId: Deno.env.get("SUPABASE_OAUTH_CLIENT_ID")!,
    scope: "all",
  },
  stripe: {
    authUrl: "https://connect.stripe.com/oauth/authorize",
    clientId: Deno.env.get("STRIPE_CLIENT_ID")!,
    scope: "read_write",
  },
};

serve(async (req) => {
  const { provider, redirect } = await req.json();
  const p = PROVIDERS[provider];
  if (!p) return new Response(JSON.stringify({ error: "unknown_provider" }), { status: 400 });

  const state = crypto.randomUUID();
  const url = new URL(p.authUrl);
  url.searchParams.set("client_id", p.clientId);
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("scope", p.scope);
  url.searchParams.set("state", state);

  return new Response(JSON.stringify({ url: url.toString() }), {
    headers: { "content-type": "application/json" },
  });
});
