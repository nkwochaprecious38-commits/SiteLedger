import { createBrowserClient } from "@supabase/ssr";

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const validUrl = /^https?:\/\/[^\s"']+$/.test(rawUrl);

// A missing or malformed value counts as not configured, so builds never crash on a typo.
export const isSupabaseConfigured = validUrl && rawKey.length > 0;

let client: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseBrowser() {
  if (!client) {
    client = createBrowserClient(
      isSupabaseConfigured ? rawUrl : "http://localhost:54321",
      isSupabaseConfigured ? rawKey : "not-configured",
      { db: { schema: "siteledger" } }
    );
  }
  return client;
}
