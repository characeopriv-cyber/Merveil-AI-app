/**
 * Merveil Content Enrichment Engine
 * Layers: entity extract → search (SerpApi) → scrape (Firecrawl / fetch) → images (Unsplash)
 * Always falls back to local deterministic assets so generation never fails without API keys.
 */

const UNSPLASH_MAP = {
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80',
  interior: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=80',
  'real estate': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80',
  marina: 'https://images.unsplash.com/photo-1600607687920-4e2a09c1590b?w=1200&q=80',
  palm: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b4?w=1200&q=80',
  fashion: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
  technology: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
  fitness: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=80',
  food: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80',
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80',
  portfolio: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1600&q=80',
  game: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80',
  office: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&q=80',
};

export function extractEntities(prompt) {
  const entities = [];
  const patterns = {
    locations: /\b(dubai|abu dhabi|london|new york|paris|tokyo|uae|usa|marina|palm|downtown|business bay|difc)\b/gi,
    industries: /\b(real estate|interior design|fashion|technology|health|fitness|education|food|travel|saas|ecommerce|restaurant)\b/gi,
    products: /\b(website|app|game|dashboard|ecommerce|portfolio|blog|tower|connect|landing)\b/gi,
  };
  for (const regex of Object.values(patterns)) {
    const matches = String(prompt || '').match(regex);
    if (matches) entities.push(...matches.map((m) => m.toLowerCase()));
  }
  return [...new Set(entities)];
}

export function localImagesFor(entities, prompt) {
  const images = [];
  const seen = new Set();
  const push = (url, alt) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    images.push({ url, thumb: url.replace('w=1600', 'w=400').replace('w=1200', 'w=400'), alt, credit: 'Unsplash' });
  };
  for (const e of entities) {
    if (UNSPLASH_MAP[e]) push(UNSPLASH_MAP[e], e);
  }
  const lower = String(prompt || '').toLowerCase();
  if (/dubai|uae|marina|real estate|interior/.test(lower)) {
    push(UNSPLASH_MAP.dubai, 'Dubai skyline');
    push(UNSPLASH_MAP.interior, 'Luxury interior');
    push(UNSPLASH_MAP.marina, 'Marina property');
    push(UNSPLASH_MAP['real estate'], 'Residence');
  }
  if (!images.length) push(UNSPLASH_MAP.office, 'Workspace');
  return images.slice(0, 8);
}

export function enrichLocal(userPrompt) {
  const entities = extractEntities(userPrompt);
  const images = localImagesFor(entities, userPrompt);
  const isDubaiInterior = /dubai/i.test(userPrompt) && /interior|real estate/i.test(userPrompt);
  return {
    prompt: userPrompt,
    entities,
    searchResults: [],
    deepContent: [],
    images,
    heroTitle: isDubaiInterior ? 'Luxury Dubai Interiors' : (userPrompt || 'Project').slice(0, 56),
    heroSubtitle: entities.length
      ? `Built for ${entities.slice(0, 5).join(' · ')}`
      : 'Generated with Merveil Developer',
    metadata: {
      enrichedAt: new Date().toISOString(),
      mode: 'local',
      sources: [],
    },
  };
}

async function searchWeb(query, apiKey) {
  if (!apiKey) return [];
  try {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', query);
    url.searchParams.set('num', '5');
    url.searchParams.set('hl', 'en');
    url.searchParams.set('api_key', apiKey);
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.organic_results || []).slice(0, 5).map((r) => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet,
    }));
  } catch {
    return [];
  }
}

async function scrapeFirecrawl(url, apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const md = data?.data?.markdown || data?.markdown || '';
    const images = data?.data?.images || [];
    return { markdown: String(md).slice(0, 2000), images: images.slice(0, 3), links: [] };
  } catch {
    return null;
  }
}

async function scrapeManual(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 MerveilEnrichment/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { markdown: '', images: [], links: [] };
    const html = await res.text();
    // Strip scripts/styles roughly
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);
    const images = [];
    const re = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;
    let m;
    while ((m = re.exec(html)) && images.length < 5) images.push(m[1]);
    return { markdown: cleaned, images, links: [] };
  } catch {
    return { markdown: '', images: [], links: [] };
  }
}

async function findUnsplashImages(query, accessKey, count = 6) {
  if (!accessKey) return [];
  try {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('per_page', String(count));
    url.searchParams.set('orientation', 'landscape');
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Client-ID ${accessKey}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((img) => ({
      url: img.urls?.regular,
      thumb: img.urls?.small,
      alt: img.alt_description || query,
      credit: img.user?.name ? `Photo by ${img.user.name} on Unsplash` : 'Unsplash',
    })).filter((i) => i.url);
  } catch {
    return [];
  }
}

/**
 * Full enrichment. Uses env keys when present; always returns a usable package.
 */
export async function enrichProject(userPrompt, env = {}) {
  const prompt = String(userPrompt || '').trim();
  if (!prompt) return enrichLocal('');

  const entities = extractEntities(prompt);
  const serpKey = env.SERPAPI_KEY || process.env.SERPAPI_KEY || '';
  const fireKey = env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY || '';
  const unsplashKey = env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY || '';

  const searchResults = await searchWeb(prompt, serpKey);

  const scrapedContent = [];
  for (const result of searchResults.slice(0, 2)) {
    let content = await scrapeFirecrawl(result.link, fireKey);
    if (!content?.markdown) content = await scrapeManual(result.link);
    scrapedContent.push({ ...result, ...content });
  }

  let images = await findUnsplashImages(entities.join(' ') || prompt, unsplashKey, 6);
  if (!images.length) images = localImagesFor(entities, prompt);

  // Never allow fashion/bag imagery for real-estate/interior prompts
  if (/real estate|interior|dubai/i.test(prompt)) {
    images = images.filter((img) => !/bag|ceramic|fashion|linen|throw/i.test(img.alt || ''));
    if (images.length < 3) images = [...images, ...localImagesFor(entities, prompt)];
  }

  const isDubaiInterior = /dubai/i.test(prompt) && /interior|real estate/i.test(prompt);

  return {
    prompt,
    entities,
    searchResults,
    deepContent: scrapedContent.map((c) => ({
      title: c.title,
      markdown: c.markdown?.substring?.(0, 2000) || c.markdown || '',
      images: (c.images || []).slice(0, 3),
    })),
    images: images.slice(0, 8),
    heroTitle:
      searchResults[0]?.title ||
      (isDubaiInterior ? 'Luxury Dubai Interiors' : prompt.slice(0, 56)),
    heroSubtitle:
      searchResults[0]?.snippet ||
      (entities.length ? `Built for ${entities.slice(0, 5).join(' · ')}` : 'Generated with Merveil Developer'),
    metadata: {
      enrichedAt: new Date().toISOString(),
      mode: serpKey || fireKey || unsplashKey ? 'live' : 'local',
      sources: searchResults.map((r) => r.link).filter(Boolean),
      usedKeys: {
        serpapi: !!serpKey,
        firecrawl: !!fireKey,
        unsplash: !!unsplashKey,
      },
    },
  };
}

export function determineProjectType(entities, prompt = '') {
  const e = entities || extractEntities(prompt);
  const lower = String(prompt).toLowerCase();
  if (e.includes('game') || /game|3d|arena|tower stack|connecta/.test(lower)) return 'game';
  if (e.includes('app') || e.includes('dashboard') || /mobile app|saas/.test(lower)) return 'app';
  if (e.includes('ecommerce') || /shop|storefront/.test(lower)) return 'ecommerce';
  if (/interior|real estate/.test(lower)) return 'interior';
  return 'website';
}

export function assetsFromEnrichment(enriched) {
  const images = enriched?.images || [];
  return {
    heroImage: images[0]?.url || null,
    gallery: images.slice(1, 5).map((i) => i.url).filter(Boolean),
    thumbnails: images.map((i) => i.thumb || i.url).filter(Boolean),
  };
}
