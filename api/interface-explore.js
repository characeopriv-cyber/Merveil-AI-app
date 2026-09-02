import { createClient } from "@supabase/supabase-js";
import { sendJson } from "../lib/supabaseServer.js";
const URL="https://dixfybqlepticyudikuz.supabase.co";
export default async function handler(req,res){if(req.method!=="GET")return sendJson(res,405,{error:"Method not allowed"});try{const db=createClient(URL,process.env.SUPABASE_SERVICE_ROLE_KEY);const limit=Math.min(50,Math.max(1,Number(req.query?.limit||24)));const {data,error}=await db.from("merveil_interfaces").select("id,name,slug,interface_type,status,configuration,created_at").eq("status","active").limit(limit);if(error)throw error;return sendJson(res,200,{interfaces:data||[]});}catch(e){console.error("interface-explore",e);return sendJson(res,500,{error:"Explore unavailable"});}}
