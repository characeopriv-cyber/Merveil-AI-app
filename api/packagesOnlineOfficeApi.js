/**
 * Merveil AI — Packages / Online Office / Worker / World Boosts / Custom Quote API
 * Mount from router.js via handlePackagesOnlineOffice(req, res, ctx)
 *
 * Actions (query or body.action):
 *   entitlements          GET  — list package entitlements + product_catalog prices
 *   office-profile        GET/POST — Online Office profile
 *   office-clients        GET/POST/PATCH
 *   office-pipeline       GET/POST/PATCH
 *   office-dashboard      GET  — aggregated RE dashboard
 *   worker-profile        GET/POST
 *   worker-jobs           GET/POST/PATCH
 *   worker-dashboard      GET
 *   boost-catalog         GET  — World boost packages
 *   boost-create          POST — purchase boost for a reel (creates intent + pending boost)
 *   boost-activate        POST — after payment confirmed (server/webhook also calls)
 *   boost-mine            GET
 *   custom-quote          POST — exact price quote (no client-side guess)
 *   custom-quote-get      GET  — by quote_code
 *   custom-quote-accept   POST — mark accepted + create payment product
 *   ranking-weight        GET  — current user ranking weight
 */

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function bad(res, status, error, extra = {}) {
  return json(res, status, { ok: false, error, ...extra });
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function quoteCode() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MQ-${t}-${r}`;
}

async function resolveUser(ctx) {
  // Prefer jwtSub / citizen from existing auth path
  const uid = ctx.jwtSub || ctx.userId || ctx.user?.id || null;
  return uid;
}

async function getAdmin(ctx) {
  return ctx.adminClient || ctx.svc || null;
}

/**
 * Exact custom package quote — pure server math from pricing rules.
 * request = { ai_call_minutes?, world_boost_hours?, world_boost_impressions?,
 *             listing_slots?, team_seats?, priority_support?, event_invite_packs? }
 */
async function computeCustomQuote(svc, request) {
  const { data: rules, error } = await svc
    .from("custom_package_pricing_rules")
    .select("*")
    .eq("active", true);
  if (error) throw new Error(error.message || "pricing_rules_failed");

  const byKey = {};
  for (const r of rules || []) byKey[r.rule_key] = r;

  const lineItems = [];
  let subtotal = 0;

  const add = (key, unitsRaw) => {
    const rule = byKey[key];
    if (!rule) return;
    let units = Number(unitsRaw);
    if (!Number.isFinite(units) || units <= 0) return;
    units = Math.floor(units);
    if (units < (rule.min_units || 1)) {
      throw new Error(`${key}: minimum ${rule.min_units} ${rule.unit_label || "units"}`);
    }
    if (rule.max_units != null && units > rule.max_units) {
      throw new Error(`${key}: maximum ${rule.max_units} ${rule.unit_label || "units"}`);
    }
    const line = round2(units * Number(rule.unit_price_aed));
    lineItems.push({
      rule_key: key,
      units,
      unit_price_aed: Number(rule.unit_price_aed),
      unit_label: rule.unit_label,
      description: rule.description,
      line_total_aed: line,
    });
    subtotal = round2(subtotal + line);
  };

  const req = request || {};
  if (req.ai_call_minutes != null) add("ai_call_minutes", req.ai_call_minutes);
  if (req.world_boost_hours != null) add("world_boost_hours", req.world_boost_hours);
  if (req.world_boost_impressions != null) add("world_boost_impressions", req.world_boost_impressions);
  if (req.listing_slots != null) add("listing_slots", req.listing_slots);
  if (req.team_seats != null) add("team_seats", req.team_seats);
  if (req.priority_support) add("priority_support", 1);
  if (req.event_invite_packs != null) add("event_invite_pack", req.event_invite_packs);

  if (lineItems.length === 0) {
    throw new Error("Select at least one option for a custom package");
  }

  // No tax for now (VAT can be added server-side later without client change)
  const discount = 0;
  const tax = 0;
  const total = round2(subtotal - discount + tax);

  return {
    line_items: lineItems,
    subtotal_aed: subtotal,
    discount_aed: discount,
    tax_aed: tax,
    total_aed: total,
    currency: "AED",
  };
}

async function handlePackagesOnlineOffice(req, res, ctx) {
  const svc = await getAdmin(ctx);
  if (!svc) return bad(res, 500, "service_unavailable");

  const method = (req.method || "GET").toUpperCase();
  const url = new URL(req.url || "/", "http://local");
  const action =
    url.searchParams.get("action") ||
    (ctx.body && ctx.body.action) ||
    "entitlements";

  const uid = await resolveUser(ctx);

  // ---------- public-ish reads (still auth preferred) ----------
  if (action === "entitlements" && method === "GET") {
    const [{ data: ents }, { data: products }] = await Promise.all([
      svc.from("package_entitlements").select("*").order("price_aed", { ascending: true }),
      svc
        .from("product_catalog")
        .select("product_id, category, display_name, amount, currency, active, meta")
        .in("category", ["passport", "world_boost"])
        .eq("active", true),
    ]);
    return json(res, 200, {
      ok: true,
      packages: ents || [],
      products: products || [],
    });
  }

  if (action === "boost-catalog" && method === "GET") {
    const { data, error } = await svc
      .from("product_catalog")
      .select("product_id, display_name, amount, currency, meta")
      .eq("category", "world_boost")
      .eq("active", true)
      .order("amount", { ascending: true });
    if (error) return bad(res, 500, error.message);
    return json(res, 200, { ok: true, boosts: data || [] });
  }

  if (action === "pricing-rules" && method === "GET") {
    const { data, error } = await svc
      .from("custom_package_pricing_rules")
      .select("rule_key, unit_price_aed, min_units, max_units, unit_label, description")
      .eq("active", true);
    if (error) return bad(res, 500, error.message);
    return json(res, 200, { ok: true, rules: data || [] });
  }

  // ---------- auth required ----------
  if (!uid) return bad(res, 401, "sign_in_required");

  // Ranking weight
  if (action === "ranking-weight" && method === "GET") {
    const { data, error } = await svc.rpc("merveil_ranking_weight", { p_user_id: uid });
    if (error) {
      // fallback if RPC missing
      return json(res, 200, { ok: true, ranking_weight: 1.0 });
    }
    return json(res, 200, { ok: true, ranking_weight: Number(data) || 1.0 });
  }

  // ---- Online Office profile ----
  if (action === "office-profile") {
    if (method === "GET") {
      const { data, error } = await svc
        .from("online_office_profiles")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) return bad(res, 500, error.message);
      return json(res, 200, { ok: true, profile: data });
    }
    if (method === "POST" || method === "PUT") {
      const b = ctx.body || {};
      const row = {
        user_id: uid,
        office_type: b.office_type || "real_estate",
        display_name: b.display_name || null,
        company_name: b.company_name || null,
        license_number: b.license_number || null,
        specializations: Array.isArray(b.specializations) ? b.specializations : [],
        service_areas: Array.isArray(b.service_areas) ? b.service_areas : [],
        bio: b.bio || null,
        avatar_url: b.avatar_url || null,
        cover_url: b.cover_url || null,
        package_id: b.package_id || null,
        ranking_weight: b.ranking_weight != null ? Number(b.ranking_weight) : undefined,
        settings: b.settings || {},
        updated_at: new Date().toISOString(),
      };
      // Strip undefined
      Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
      const { data, error } = await svc
        .from("online_office_profiles")
        .upsert(row, { onConflict: "user_id" })
        .select()
        .maybeSingle();
      if (error) return bad(res, 500, error.message);
      return json(res, 200, { ok: true, profile: data });
    }
  }

  // ---- Office clients ----
  if (action === "office-clients") {
    if (method === "GET") {
      const status = url.searchParams.get("status");
      let q = svc
        .from("office_clients")
        .select("*")
        .eq("owner_id", uid)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) return bad(res, 500, error.message);
      return json(res, 200, { ok: true, clients: data || [] });
    }
    if (method === "POST") {
      const b = ctx.body || {};
      if (!b.client_name || String(b.client_name).trim().length < 1) {
        return bad(res, 400, "client_name_required");
      }
      const row = {
        owner_id: uid,
        client_user_id: b.client_user_id || null,
        client_name: String(b.client_name).trim(),
        client_phone: b.client_phone || null,
        client_email: b.client_email || null,
        source: b.source || "manual",
        status: b.status || "lead",
        notes: b.notes || null,
        tags: Array.isArray(b.tags) ? b.tags : [],
        meta: b.meta || {},
      };
      const { data, error } = await svc.from("office_clients").insert(row).select().maybeSingle();
      if (error) return bad(res, 500, error.message);
      return json(res, 200, { ok: true, client: data });
    }
    if (method === "PATCH") {
      const b = ctx.body || {};
      const id = b.id || url.searchParams.get("id");
      if (!id) return bad(res, 400, "id_required");
      const patch = {
        updated_at: new Date().toISOString(),
      };
      ["client_name", "client_phone", "client_email", "status", "notes", "source"].forEach((k) => {
        if (b[k] !== undefined) patch[k] = b[k];
      });
      if (Array.isArray(b.tags)) patch.tags = b.tags;
      if (b.meta) patch.meta = b.meta;
      if (b.last_contact_at) patch.last_contact_at = b.last_contact_at;
      const { data, error } = await svc
        .from("office_clients")
        .update(patch)
        .eq("id", id)
        .eq("owner_id", uid)
        .select()
        .maybeSingle();
      if (error) return bad(res, 500, error.message);
      if (!data) return bad(res, 404, "client_not_found");
      return json(res, 200, { ok: true, client: data });
    }
  }

  // ---- Office pipeline ----
  if (action === "office-pipeline") {
    if (method === "GET") {
      const status = url.searchParams.get("status");
      let q = svc
        .from("office_pipeline")
        .select("*")
        .eq("owner_id", uid)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) return bad(res, 500, error.message);
      return json(res, 200, { ok: true, pipeline: data || [] });
    }
    if (method === "POST") {
      const b = ctx.body || {};
      if (!b.title) return bad(res, 400, "title_required");
      const row = {
        owner_id: uid,
        client_id: b.client_id || null,
        pipeline_type: b.pipeline_type || "listing",
        title: String(b.title).trim(),
        property_id: b.property_id || null,
        service_category: b.service_category || null,
        status: b.status || "ongoing",
        value_aed: b.value_aed != null ? Number(b.value_aed) : null,
        commission_pct: b.commission_pct != null ? Number(b.commission_pct) : null,
        commission_aed: b.commission_aed != null ? Number(b.commission_aed) : null,
        meta: b.meta || {},
      };
      const { data, error } = await svc.from("office_pipeline").insert(row).select().maybeSingle();
      if (error) return bad(res, 500, error.message);
      return json(res, 200, { ok: true, item: data });
    }
    if (method === "PATCH") {
      const b = ctx.body || {};
      const id = b.id || url.searchParams.get("id");
      if (!id) return bad(res, 400, "id_required");
      const patch = { updated_at: new Date().toISOString() };
      ["title", "status", "pipeline_type", "service_category", "client_id", "property_id"].forEach((k) => {
        if (b[k] !== undefined) patch[k] = b[k];
      });
      if (b.value_aed != null) patch.value_aed = Number(b.value_aed);
      if (b.commission_pct != null) patch.commission_pct = Number(b.commission_pct);
      if (b.commission_aed != null) patch.commission_aed = Number(b.commission_aed);
      if (b.status === "closed") patch.closed_at = new Date().toISOString();
      if (b.meta) patch.meta = b.meta;
      const { data, error } = await svc
        .from("office_pipeline")
        .update(patch)
        .eq("id", id)
        .eq("owner_id", uid)
        .select()
        .maybeSingle();
      if (error) return bad(res, 500, error.message);
      if (!data) return bad(res, 404, "pipeline_not_found");
      return json(res, 200, { ok: true, item: data });
    }
  }

  // ---- Office dashboard aggregate ----
  if (action === "office-dashboard" && method === "GET") {
    const [profile, clients, pipeline, quota] = await Promise.all([
      svc.from("online_office_profiles").select("*").eq("user_id", uid).maybeSingle(),
      svc.from("office_clients").select("id, status").eq("owner_id", uid),
      svc.from("office_pipeline").select("id, status, value_aed, commission_aed, pipeline_type").eq("owner_id", uid),
      svc.from("office_ai_call_quota").select("*").eq("user_id", uid).maybeSingle(),
    ]);

    const clientRows = clients.data || [];
    const pipeRows = pipeline.data || [];
    const stats = {
      clients_total: clientRows.length,
      clients_lead: clientRows.filter((c) => c.status === "lead").length,
      clients_active: clientRows.filter((c) => c.status === "active").length,
      clients_closed_won: clientRows.filter((c) => c.status === "closed_won").length,
      pipeline_ongoing: pipeRows.filter((p) => p.status === "ongoing").length,
      pipeline_closed: pipeRows.filter((p) => p.status === "closed").length,
      pipeline_value_ongoing: round2(
        pipeRows.filter((p) => p.status === "ongoing").reduce((s, p) => s + (Number(p.value_aed) || 0), 0)
      ),
      pipeline_value_closed: round2(
        pipeRows.filter((p) => p.status === "closed").reduce((s, p) => s + (Number(p.value_aed) || 0), 0)
      ),
      commission_closed: round2(
        pipeRows.filter((p) => p.status === "closed").reduce((s, p) => s + (Number(p.commission_aed) || 0), 0)
      ),
    };

    return json(res, 200, {
      ok: true,
      profile: profile.data || null,
      stats,
      ai_call_quota: quota.data || null,
    });
  }

  // ---- Worker profile ----
  if (action === "worker-profile") {
    if (method === "GET") {
      const { data, error } = await svc.from("worker_profiles").select("*").eq("user_id", uid).maybeSingle();
      if (error) return bad(res, 500, error.message);
      return json(res, 200, { ok: true, profile: data });
    }
    if (method === "POST" || method === "PUT") {
      const b = ctx.body || {};
      if (!b.trade) return bad(res, 400, "trade_required");
      const row = {
        user_id: uid,
        trade: String(b.trade).toLowerCase().trim(),
        display_name: b.display_name || null,
        company_name: b.company_name || null,
        license_or_id: b.license_or_id || null,
        years_experience: b.years_experience != null ? Number(b.years_experience) : null,
        service_areas: Array.isArray(b.service_areas) ? b.service_areas : [],
        skills: Array.isArray(b.skills) ? b.skills : [],
        take_rate_pct: b.take_rate_pct != null ? Number(b.take_rate_pct) : 12,
        package_id: b.package_id || null,
        settings: b.settings || {},
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await svc
        .from("worker_profiles")
        .upsert(row, { onConflict: "user_id" })
        .select()
        .maybeSingle();
      if (error) return bad(res, 500, error.message);
      return json(res, 200, { ok: true, profile: data });
    }
  }

  // ---- Worker jobs ----
  if (action === "worker-jobs") {
    if (method === "GET") {
      const status = url.searchParams.get("status");
      let q = svc
        .from("worker_jobs")
        .select("*")
        .eq("worker_id", uid)
        .order("updated_at", { ascending: false })
        .limit(200);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) return bad(res, 500, error.message);
      return json(res, 200, { ok: true, jobs: data || [] });
    }
    if (method === "POST") {
      const b = ctx.body || {};
      if (!b.title || !b.service_category) return bad(res, 400, "title_and_service_category_required");
      // Default take rate from platform table
      let takeRate = 12;
      const { data: tr } = await svc
        .from("platform_take_rates")
        .select("take_rate_pct")
        .eq("category", "services_default")
        .maybeSingle();
      if (tr) takeRate = Number(tr.take_rate_pct) || 12;

      const quoted = b.quoted_aed != null ? Number(b.quoted_aed) : null;
      const row = {
        worker_id: uid,
        client_id: b.client_id || null,
        client_user_id: b.client_user_id || null,
        building_name: b.building_name || null,
        building_address: b.building_address || null,
        service_category: String(b.service_category).toLowerCase(),
        title: String(b.title).trim(),
        status: b.status || "quoted",
        quoted_aed: quoted,
        take_rate_pct: takeRate,
        meta: b.meta || {},
      };
      if (quoted != null) {
        row.platform_fee_aed = round2((quoted * takeRate) / 100);
        row.worker_payout_aed = round2(quoted - row.platform_fee_aed);
      }
      const { data, error } = await svc.from("worker_jobs").insert(row).select().maybeSingle();
      if (error) return bad(res, 500, error.message);
      return json(res, 200, { ok: true, job: data });
    }
    if (method === "PATCH") {
      const b = ctx.body || {};
      const id = b.id || url.searchParams.get("id");
      if (!id) return bad(res, 400, "id_required");
      const patch = { updated_at: new Date().toISOString() };
      ["title", "status", "building_name", "building_address", "service_category", "client_id"].forEach((k) => {
        if (b[k] !== undefined) patch[k] = b[k];
      });
      if (b.final_aed != null) {
        const final = Number(b.final_aed);
        patch.final_aed = final;
        // Recompute fees
        const { data: existing } = await svc
          .from("worker_jobs")
          .select("take_rate_pct")
          .eq("id", id)
          .eq("worker_id", uid)
          .maybeSingle();
        const tr = existing ? Number(existing.take_rate_pct) || 12 : 12;
        patch.platform_fee_aed = round2((final * tr) / 100);
        patch.worker_payout_aed = round2(final - patch.platform_fee_aed);
      }
      if (b.status === "completed") patch.completed_at = new Date().toISOString();
      if (b.meta) patch.meta = b.meta;
      const { data, error } = await svc
        .from("worker_jobs")
        .update(patch)
        .eq("id", id)
        .eq("worker_id", uid)
        .select()
        .maybeSingle();
      if (error) return bad(res, 500, error.message);
      if (!data) return bad(res, 404, "job_not_found");
      // bump jobs_completed on worker profile when completed
      if (data.status === "completed") {
        await svc.rpc("noop").catch(() => {});
        const { data: wp } = await svc.from("worker_profiles").select("jobs_completed").eq("user_id", uid).maybeSingle();
        if (wp) {
          await svc
            .from("worker_profiles")
            .update({ jobs_completed: (wp.jobs_completed || 0) + 1, updated_at: new Date().toISOString() })
            .eq("user_id", uid);
        }
      }
      return json(res, 200, { ok: true, job: data });
    }
  }

  // ---- Worker dashboard ----
  if (action === "worker-dashboard" && method === "GET") {
    const [profile, jobs] = await Promise.all([
      svc.from("worker_profiles").select("*").eq("user_id", uid).maybeSingle(),
      svc.from("worker_jobs").select("id, status, final_aed, quoted_aed, platform_fee_aed, worker_payout_aed, service_category").eq("worker_id", uid),
    ]);
    const rows = jobs.data || [];
    const completed = rows.filter((j) => j.status === "completed");
    const ongoing = rows.filter((j) => j.status === "ongoing" || j.status === "quoted");
    const stats = {
      jobs_total: rows.length,
      jobs_ongoing: ongoing.length,
      jobs_completed: completed.length,
      earnings_completed: round2(completed.reduce((s, j) => s + (Number(j.worker_payout_aed) || 0), 0)),
      platform_fees: round2(completed.reduce((s, j) => s + (Number(j.platform_fee_aed) || 0), 0)),
      pipeline_quoted: round2(ongoing.reduce((s, j) => s + (Number(j.quoted_aed) || 0), 0)),
    };
    return json(res, 200, {
      ok: true,
      profile: profile.data || null,
      stats,
      recent_jobs: rows.slice(0, 20),
    });
  }

  // ---- World boost create (pending until payment) ----
  if (action === "boost-create" && method === "POST") {
    const b = ctx.body || {};
    const postId = b.post_id;
    const productId = b.product_id;
    if (!postId || !productId) return bad(res, 400, "post_id_and_product_id_required");

    const { data: product, error: pe } = await svc
      .from("product_catalog")
      .select("*")
      .eq("product_id", productId)
      .eq("category", "world_boost")
      .eq("active", true)
      .maybeSingle();
    if (pe || !product) return bad(res, 400, "invalid_boost_product");

    // Optional package discount
    let amount = Number(product.amount);
    const { data: office } = await svc
      .from("online_office_profiles")
      .select("package_id")
      .eq("user_id", uid)
      .maybeSingle();
    if (office?.package_id) {
      const { data: ent } = await svc
        .from("package_entitlements")
        .select("world_boost_discount_pct")
        .eq("package_id", office.package_id)
        .maybeSingle();
      if (ent && Number(ent.world_boost_discount_pct) > 0) {
        amount = round2(amount * (1 - Number(ent.world_boost_discount_pct) / 100));
      }
    }

    const meta = product.meta || {};
    const durationHours = Number(meta.duration_hours) || 24;
    const now = new Date();
    const ends = new Date(now.getTime() + durationHours * 3600 * 1000);

    const row = {
      post_id: postId,
      owner_id: uid,
      product_id: productId,
      status: "pending",
      reach_multiplier: Number(meta.reach_multiplier) || 1.8,
      priority_slot: !!meta.priority_slot,
      max_impressions: meta.max_impressions != null ? Number(meta.max_impressions) : null,
      impressions_used: 0,
      starts_at: now.toISOString(),
      ends_at: ends.toISOString(),
      amount_paid_aed: amount,
      currency: product.currency || "AED",
      meta: { catalog_meta: meta },
    };

    const { data: boost, error } = await svc.from("world_boosts").insert(row).select().maybeSingle();
    if (error) return bad(res, 500, error.message);

    return json(res, 200, {
      ok: true,
      boost,
      amount_aed: amount,
      currency: product.currency || "AED",
      // Client should create payment via /api/payments create-checkout with product_id
      // or wallet spend; after settlement call boost-activate with boost.id
      next: {
        product_id: productId,
        amount_aed: amount,
        activate_action: "boost-activate",
        boost_id: boost.id,
      },
    });
  }

  // Activate after payment (also callable from webhook path)
  if (action === "boost-activate" && method === "POST") {
    const b = ctx.body || {};
    const boostId = b.boost_id;
    if (!boostId) return bad(res, 400, "boost_id_required");
    const { data: boost, error } = await svc
      .from("world_boosts")
      .select("*")
      .eq("id", boostId)
      .eq("owner_id", uid)
      .maybeSingle();
    if (error || !boost) return bad(res, 404, "boost_not_found");
    if (boost.status === "active") return json(res, 200, { ok: true, boost });

    const { data: updated, error: ue } = await svc
      .from("world_boosts")
      .update({
        status: "active",
        payment_intent_id: b.payment_intent_id || boost.payment_intent_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", boostId)
      .eq("owner_id", uid)
      .select()
      .maybeSingle();
    if (ue) return bad(res, 500, ue.message);
    return json(res, 200, { ok: true, boost: updated });
  }

  if (action === "boost-mine" && method === "GET") {
    const { data, error } = await svc
      .from("world_boosts")
      .select("*")
      .eq("owner_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return bad(res, 500, error.message);
    return json(res, 200, { ok: true, boosts: data || [] });
  }

  // ---- Custom package quote (exact price) ----
  if (action === "custom-quote" && method === "POST") {
    const b = ctx.body || {};
    const request = b.request || b;
    let computed;
    try {
      computed = await computeCustomQuote(svc, request);
    } catch (e) {
      return bad(res, 400, e.message || "quote_failed");
    }

    const code = quoteCode();
    const expires = new Date(Date.now() + 48 * 3600 * 1000); // 48h validity

    const row = {
      user_id: uid,
      quote_code: code,
      status: "quoted",
      request_payload: request,
      line_items: computed.line_items,
      subtotal_aed: computed.subtotal_aed,
      discount_aed: computed.discount_aed,
      tax_aed: computed.tax_aed,
      total_aed: computed.total_aed,
      currency: computed.currency,
      expires_at: expires.toISOString(),
      meta: {},
    };

    const { data, error } = await svc.from("custom_package_quotes").insert(row).select().maybeSingle();
    if (error) return bad(res, 500, error.message);

    return json(res, 200, {
      ok: true,
      quote: data,
      // Exact numbers — client must display these, never recalculate
      exact: {
        quote_code: code,
        total_aed: computed.total_aed,
        currency: computed.currency,
        line_items: computed.line_items,
        expires_at: expires.toISOString(),
      },
    });
  }

  if (action === "custom-quote-get" && method === "GET") {
    const code = url.searchParams.get("code") || url.searchParams.get("quote_code");
    if (!code) return bad(res, 400, "quote_code_required");
    const { data, error } = await svc
      .from("custom_package_quotes")
      .select("*")
      .eq("quote_code", code)
      .eq("user_id", uid)
      .maybeSingle();
    if (error) return bad(res, 500, error.message);
    if (!data) return bad(res, 404, "quote_not_found");
    return json(res, 200, { ok: true, quote: data });
  }

  if (action === "custom-quote-accept" && method === "POST") {
    const b = ctx.body || {};
    const code = b.quote_code || b.code;
    if (!code) return bad(res, 400, "quote_code_required");
    const { data: quote, error } = await svc
      .from("custom_package_quotes")
      .select("*")
      .eq("quote_code", code)
      .eq("user_id", uid)
      .maybeSingle();
    if (error || !quote) return bad(res, 404, "quote_not_found");
    if (quote.status === "paid") return json(res, 200, { ok: true, quote });
    if (new Date(quote.expires_at) < new Date()) {
      await svc.from("custom_package_quotes").update({ status: "expired" }).eq("id", quote.id);
      return bad(res, 410, "quote_expired");
    }

    // Register a one-off product in catalog so payment path uses server amount
    const productId = `custom:${quote.quote_code}`;
    await svc.from("product_catalog").upsert(
      {
        product_id: productId,
        category: "custom_package",
        display_name: `Custom Package ${quote.quote_code}`,
        amount: quote.total_aed,
        currency: quote.currency || "AED",
        active: true,
        meta: { quote_id: quote.id, quote_code: quote.quote_code },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" }
    );

    const { data: updated, error: ue } = await svc
      .from("custom_package_quotes")
      .update({
        status: "accepted",
        product_id: productId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", quote.id)
      .select()
      .maybeSingle();
    if (ue) return bad(res, 500, ue.message);

    return json(res, 200, {
      ok: true,
      quote: updated,
      product_id: productId,
      amount_aed: quote.total_aed,
      currency: quote.currency || "AED",
    });
  }

  return bad(res, 400, "unknown_action", { action });
}

export { handlePackagesOnlineOffice, computeCustomQuote };
export default { handlePackagesOnlineOffice, computeCustomQuote };
