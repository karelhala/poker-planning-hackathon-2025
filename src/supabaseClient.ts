import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || ''

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Supabase URL or publishable Key is missing. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)

