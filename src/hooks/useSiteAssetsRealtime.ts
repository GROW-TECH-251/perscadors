'use client';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
export function useSiteAssetsRealtime(onChange: () => void) {
 const ref=useRef(onChange); useEffect(()=>{ref.current=onChange},[onChange]);
 useEffect(()=>{ const client=supabase; if(!client)return; let timer:ReturnType<typeof setTimeout>|undefined; const c=client.channel('perscadors-assets').on('postgres_changes',{event:'*',schema:'public',table:'site_assets'},()=>{if(timer)clearTimeout(timer);timer=setTimeout(()=>ref.current(),200)}).subscribe(); return()=>{if(timer)clearTimeout(timer);client.removeChannel(c)};},[]);
}
