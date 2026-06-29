import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * Single Supabase client for the app. Session is persisted in AsyncStorage so the
 * user stays signed in across launches. The client only ever uses the public anon
 * key; all privileged work (AI generation) happens in Edge Functions, never here.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
