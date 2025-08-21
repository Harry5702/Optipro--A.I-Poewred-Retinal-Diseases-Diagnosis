// Test Supabase connection
import { supabase } from './lib/supabase';

export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
    console.log('Supabase Key length:', process.env.REACT_APP_SUPABASE_ANON_KEY?.length);
    
    // Test connection by trying to fetch from a table
    const { data, error } = await supabase
      .from('doctors')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Supabase connection successful!');
    return { success: true, data };
  } catch (error) {
    console.error('Supabase test error:', error);
    return { success: false, error: error.message };
  }
};
