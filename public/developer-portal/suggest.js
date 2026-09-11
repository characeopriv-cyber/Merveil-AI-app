/* SUGGEST ENGINE — free-text idea → suggestions */
import { SECTORS, TEMPLATES } from './catalog.js';

const INTENTS = [
  { id:'website',  kw:['website','site','landing','homepage','page'], label:'website', kind:'website' },
  { id:'web_app',  kw:['app','dashboard','platform','saas','tool','portal'], label:'web app', kind:'web_app' },
  { id:'ai_agent', kw:['agent','assistant','bot','automation','ai '], label:'AI agent', kind:'ai_agent' },
  { id:'store',    kw:['store','shop','ecommerce','sell','product','checkout'], label:'online store', kind:'web_app' },
  { id:'booking',  kw:['booking','reservation','appointment','schedule'], label:'booking system', kind:'web_app' },
  { id:'game',     kw:['game','rpg','puzzle','shooter','arcade'], label:'game', kind:'game_3d' },
  { id:'music',    kw:['song','music','track','beat','album'], label:'music project', kind:'music' },
  { id:'book',     kw:['book','ebook','novel','guide','stories'], label:'book', kind:'book' },
  { id:'video',    kw:['video','reel','short','clip','film'], label:'video', kind:'video' },
  { id:'blog',     kw:['blog','newsletter','magazine'], label:'blog', kind:'website' },
  { id:'portfolio',kw:['portfolio','showcase','gallery'], label:'portfolio', kind:'website' },
  { id:'course',   kw:['course','class','training','tutorial','academy'], label:'course', kind:'website' },
  { id:'event',    kw:['event','conference','wedding','meetup'], label:'event site', kind:'website' },
];

const TONES = ['Warm Editorial','Clean SaaS','Bold Market','Soft Boutique'];
const AUDIENCES = ['individuals','small businesses','enterprises','creatives','students','families','tourists','professionals'];

export async function suggestFor(query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const intent = detectIntent(q);
  const sectors = matchSectors(q);
  const suggestions = [];

  if (intent) {
    for (const s of sectors.slice(0, 4)) {
      suggestions.push({
        emoji: s.emoji,
        label: `A ${intent.label} for ${s.label.toLowerCase()}`,
        tag: 'top',
        expand: intent.expand(s.label),
        sector: s,
      });
    }
  }
  for (const s of sectors.slice(0, 8)) {
    suggestions.push({
      emoji: s.emoji,
      label: `Everything ${s.label.toLowerCase()}`,
      tag: 'industry',
      expand: `A modern digital presence for ${s.label.toLowerCase()} — website, booking, AI assistant`,
      sector: s,
    });
  }
  if (intent) {
    for (const t of TONES) {
      for (const a of AUDIENCES.slice(0, 3)) {
        suggestions.push({
          emoji: '✦',
          label: `${t} ${intent.label} for ${a}`,
          tag: 'tone',
          expand: `A ${t.toLowerCase()} ${intent.label} targeting ${a}`,
        });
      }
    }
  }
  for (const t of TEMPLATES.slice(0, 4)) {
    suggestions.push({
      emoji: '◆',
      label: `${t.name} template`,
      tag: 'template',
      expand: `Build with the ${t.name} template`,
    });
  }
  if (!suggestions.length) {
    for (const s of SECTORS.slice(0, 8)) {
      suggestions.push({
        emoji: s.emoji,
        label: `A modern ${s.label.toLowerCase()} presence`,
        tag: 'popular',
        expand: `A modern digital presence for ${s.label.toLowerCase()}`,
        sector: s,
      });
    }
  }
  const seen = new Set();
  return suggestions.filter(s => {
    const k = s.label.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 200);
}

function detectIntent(q) {
  for (const i of INTENTS) {
    if (i.kw.some(k => q.includes(k))) {
      return { label: i.label, kind: i.kind, expand: (sector) => `A ${i.label} for ${sector.toLowerCase()}` };
    }
  }
  return { label: 'digital presence', kind: 'website', expand: (sector) => `A modern digital presence for ${sector.toLowerCase()}` };
}

function matchSectors(q) {
  const tokens = q.split(/[\s,.\-/]+/).filter(t => t.length > 2);
  const scored = SECTORS.map(s => {
    const lower = s.label.toLowerCase();
    let score = 0;
    if (q.includes(lower)) score += 10;
    for (const t of tokens) if (lower.includes(t)) score += 3;
    return { s, score };
  });
  const matched = scored.filter(x => x.score > 0).sort((a,b) => b.score - a.score).map(x => x.s);
  if (matched.length) return matched;
  return SECTORS.filter((_, i) => i % 7 === 0).slice(0, 12);
}
