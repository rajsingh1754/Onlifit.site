import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : { auth: { getSession: async()=>({data:{session:null}}), signInWithPassword: async()=>({error:{message:'No Supabase'}}), signUp: async()=>({error:{message:'No Supabase'}}), signOut: async()=>{}, onAuthStateChange: ()=>({data:{subscription:{unsubscribe:()=>{}}}}) }, from: ()=>({ select:()=>({eq:()=>({single:async()=>({data:null,error:true}),order:async()=>({data:[],error:true}),data:[],error:true}),order:()=>({data:[],error:true}),data:[],error:true}), insert:async()=>({error:true}), update:()=>({eq:async()=>({error:true})}), upsert:async()=>({error:true}), delete:()=>({eq:async()=>({error:true})}) }) }