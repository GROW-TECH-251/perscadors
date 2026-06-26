import { supabase, isSupabaseConfigured } from "../lib/supabase";

export async function trackEvent(name: string, metadata: object = {}) {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from('analytics_events')
    .insert([{ event_name: name, metadata }]);

  if (error) console.error("[Analytics] Tracking failed:", error.message);
}

export async function fetchAnalyticsData() {
  if (!isSupabaseConfigured || !supabase) {
    return { dailyRevenue: [], topProducts: [] };
  }

  const [revRes, prodRes] = await Promise.all([
    supabase.rpc('get_daily_revenue'),
    supabase.rpc('get_top_viewed_products')
  ]);

  return {
    dailyRevenue: revRes.data || [],
    topProducts: prodRes.data || []
  };
}