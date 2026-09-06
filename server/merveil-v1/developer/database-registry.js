export const DATABASE_PROVIDERS=[
 {id:'supabase',name:'Supabase',mode:'managed',status:'available',role:'initial-managed-database'},
 {id:'cloudflare-d1',name:'Cloudflare D1',mode:'managed',status:'planned',role:'edge-sql'},
 {id:'neon',name:'Neon',mode:'external',status:'planned',role:'serverless-postgres'},
 {id:'mongodb',name:'MongoDB',mode:'external',status:'planned',role:'document-database'}
];
export function databaseCatalog(id=''){return id?DATABASE_PROVIDERS.find(x=>x.id===String(id).toLowerCase())||null:DATABASE_PROVIDERS;}
