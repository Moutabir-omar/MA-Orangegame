import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Create a single supabase client for the entire application
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yzwcpypkeehqonfpwbuu.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6d2NweXBrZWVocW9uZnB3YnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODY5NjEsImV4cCI6MjA1OTI2Mjk2MX0.5qQ1Z8hedBEph4KjZOMflMDeFw5LbfrkqgPSiW5KKN4"

console.log("Initializing Supabase client with:", {
  url: supabaseUrl.substring(0, 15) + "...",
  keyLength: supabaseAnonKey.length,
})

// Create client for client-side usage
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Create a server-side client (for server components and API routes)
export const createServerSupabaseClient = () => {
  return createClient<Database>(
    process.env.SUPABASE_URL || supabaseUrl,
    process.env.SUPABASE_ANON_KEY || supabaseAnonKey,
    {
      auth: {
        persistSession: false,
      },
    },
  )
}

