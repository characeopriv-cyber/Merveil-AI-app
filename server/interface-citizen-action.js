import { createClient } from '@supabase/supabase-js';
import { getSession } from '../lib/supabaseServer.js';

const SUPABASE_URL='https://dixfybqlepticyudikuz.supabase.co';
const db=()=>createClient(SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_ROLE||'',{auth:{autoRefreshToken:false,persistSession:false}});
const bodyOf=req=>typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
const uidOf=async(req,res)=>{const s=await getSession(req,res).catch(()=>({user:null,jwtSub:null}));return s?.user?.id||s?.jwtSub||null};
const interfaceReturn=(listing,action)=>`/interface?product=${encodeURIComponent(listing.id)}&action=${encodeURIComponent(action)}&return=interface`;
async function notify(svc,recipientId,senderId,type,title,body,data){if(!recipientId)return null;const {data:row,error}=await svc.from('notifications').insert({recipient_id:recipientId,sender_id:senderId||null,type,title,body,data,is_read:false,priority:'normal',channel:'in_app'}).select('*').maybeSingle();if(error)throw error;return row;}
async function audit(svc,uid,listing,action,outcome,metadata={},target=null){const {error}=await svc.from('interface_action_events').insert({actor_user_id:uid,project_id:listing.developer_project_id||null,listing_id:listing.id,action,outcome,target_user_id:target,metadata});if(error)throw error;}

export default async function interfaceCitizenAction(req,res){
  if(req.method!=='POST')return{status:405,body:{error:'Method not allowed'}};
  const uid=await uidOf(req,res);if(!uid)return{status:401,body:{error:'Sign in required',code:'AUTH_REQUIRED'}};
  let body;try{body=bodyOf(req)}catch{return{status:400,body:{error:'Invalid JSON',code:'INVALID_JSON'}}}
  const action=String(body.action||'').toLowerCase();
  const allowed=['connect','message','call','collaborate','invest'];
  if(!allowed.includes(action))return{status:400,body:{error:'Unsupported Interface citizen action',code:'INTERFACE_ACTION_INVALID'}};
  const listingId=String(body.listingId||body.interface_product_id||'').trim();
  if(!listingId)return{status:400,body:{error:'listingId is required',code:'LISTING_REQUIRED'}};
  const svc=db();
  const {data:listing,error:le}=await svc.from('listings').select('id,developer_project_id,project_id,publisher_user_id,status,interface_state,published_at,title,slug,category,verified_at,deleted_at,frozen_at').eq('id',listingId).maybeSingle();
  if(le)return{status:500,body:{error:le.message,code:'LISTING_LOOKUP_FAILED'}};
  if(!listing)return{status:404,body:{error:'Interface product not found',code:'LISTING_NOT_FOUND'}};
  if(listing.status!=='approved'||listing.interface_state!=='live'||listing.deleted_at||listing.frozen_at)return{status:410,body:{error:'Interface product is not currently live',code:'LISTING_NOT_LIVE'}};
  const targetId=listing.publisher_user_id;
  if(!targetId)return{status:409,body:{error:'Product creator is unavailable',code:'CREATOR_UNAVAILABLE'}};
  if(targetId===uid)return{status:400,body:{error:'You cannot perform this action on your own product',code:'SELF_ACTION'}};
  const returnPath=String(body.return_path||interfaceReturn(listing,action)).slice(0,1000);
  const baseMeta={source:'interface',interface_product_id:listing.id,project_id:listing.developer_project_id||listing.project_id,return_path:returnPath,action};
  let destination=action,destinationId=null,status='opened';
  if(action==='connect'){
    const {data:existing,error:ee}=await svc.from('connections').select('id,status').or(`and(user_id.eq.${uid},connected_user_id.eq.${targetId}),and(user_id.eq.${targetId},connected_user_id.eq.${uid})`).limit(1).maybeSingle();
    if(ee)throw ee;
    if(existing){destinationId=existing.id;status=existing.status||'pending';}
    else{
      const {data:c,error}=await svc.from('connections').insert({user_id:uid,connected_user_id:targetId,status:'pending'}).select('id,status').single();
      if(error)throw error;destinationId=c.id;status='pending';
      await notify(svc,targetId,uid,'interface_connect_request','Connection request from Interface','A Merveil citizen wants to connect with you through your Interface product.',{route:'/connect',...baseMeta,connection_id:c.id});
    }
  }else if(action==='message'){
    let conversation=null;
    const {data:cs,error:ce}=await svc.from('conversations').select('id,participant_ids').contains('participant_ids',[uid,targetId]).order('created_at',{ascending:false}).limit(20);
    if(ce)throw ce;conversation=(cs||[]).find(c=>Array.isArray(c.participant_ids)&&c.participant_ids.includes(uid)&&c.participant_ids.includes(targetId));
    if(!conversation){const {data:c,error}=await svc.from('conversations').insert({participant_ids:[uid,targetId],context_label:`Interface · ${listing.title||'Product'}`,last_activity_at:new Date().toISOString()}).select('id,participant_ids').single();if(error)throw error;conversation=c;}
    destinationId=conversation.id;status='opened';
    await notify(svc,targetId,uid,'interface_message','Message opened from Interface','A conversation was opened from an Interface product.',{route:'/messages',conversation_id:conversation.id,...baseMeta});
  }else if(action==='call'){
    const {data:profile,error:pe}=await svc.from('profiles').select('call_restriction').eq('id',targetId).maybeSingle();if(pe)throw pe;
    if(profile?.call_restriction&&profile.call_restriction!=='none')return{status:403,body:{error:'Creator call is restricted',code:'CALL_RESTRICTED'}};
    status='pending';
    await notify(svc,targetId,uid,'interface_call_request','Call request from Interface','A citizen requested a call from your Interface product.',{route:'/connect',...baseMeta});
  }else{
    destination=action;status='pending';
    const investment=action==='invest';
    await notify(svc,targetId,uid,investment?'interface_investment_request':'interface_collaboration_request',investment?'Investment request from Interface':'Collaboration request from Interface',investment?'A citizen wants to discuss investment in your product or business.':'A citizen wants to collaborate around your product.',{route:'/interface',...baseMeta});
  }
  const {data:link,error:ae}=await svc.from('interface_action_links').insert({listing_id:listing.id,project_id:listing.developer_project_id||listing.project_id||null,actor_user_id:uid,target_user_id:targetId,action,status,destination,destination_id:destinationId,metadata:baseMeta}).select('id').single();if(ae)throw ae;
  await audit(svc,uid,listing,action,status,{...baseMeta,destination,destination_id:destinationId},targetId);
  const deepLink=action==='message'&&destinationId?`/messages?conversation=${encodeURIComponent(destinationId)}&return=${encodeURIComponent(returnPath)}`:returnPath;
  return{status:200,body:{ok:true,action,status,destination,destination_id:destinationId,link_id:link.id,target_user_id:targetId,interface_product_id:listing.id,return_path:returnPath,deep_link:deepLink}};
}
