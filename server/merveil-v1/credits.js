import { json, requireApiKey, logApiUsage, supabaseAdmin } from './_lib.js';

export default async function handler(req,res){
  if(req.method==='OPTIONS') return json(res,204,null);
  const auth=await requireApiKey(req,'credits:read',res);
  if(auth.error) return json(res,auth.status||401,{error:auth.status===403?'insufficient_scope':'unauthorized',message:auth.error,request_id:auth.requestId},auth.headers);
  if(req.method!=='GET') return json(res,405,{error:'method_not_allowed',request_id:auth.requestId});
  const {data,error}=await supabaseAdmin.from('credit_wallets').select('user_id,balance,locked_balance,lifetime_earned,lifetime_purchased,lifetime_spent,updated_at,created_at').eq('user_id',auth.app.user_id).maybeSingle();
  if(error){await logApiUsage(auth,req,500);return json(res,500,{error:'database_error',request_id:auth.requestId});}
  await logApiUsage(auth,req,200); return json(res,200,{data:data||{user_id:auth.app.user_id,balance:0,locked_balance:0},request_id:auth.requestId});
}
