// Test script to verify database setup
import { supabase, supabaseHelpers } from './lib/supabase.js';

export const testDatabaseSetup = async () => {
  console.log('=== Testing Database Setup ===');
  
  try {
    // Test 1: Check if tables exist
    console.log('1. Testing if doctors table exists...');
    const { data: doctorsTest, error: doctorsError } = await supabase
      .from('doctors')
      .select('count')
      .limit(1);
    
    if (doctorsError) {
      console.error('❌ Doctors table test failed:', doctorsError);
      return { success: false, error: `Doctors table error: ${doctorsError.message}` };
    }
    console.log('✅ Doctors table exists');
    
    // Test 2: Test email check function
    console.log('2. Testing email check function...');
    const { data: emailCheck, error: emailError } = await supabaseHelpers.getDoctorByEmail('test@nonexistent.com');
    
    if (emailError) {
      console.error('❌ Email check failed:', emailError);
      return { success: false, error: `Email check error: ${emailError.message}` };
    }
    console.log('✅ Email check function works, result:', emailCheck);
    
    // Test 3: Test doctor creation (then clean up)
    console.log('3. Testing doctor creation...');
    const testDoctor = {
      id: 'test-id-12345',
      full_name: 'Test Doctor',
      email: 'test@testdoctor.com',
      password: 'testpassword',
      specialization: 'Test Specialty',
      license_number: 'TEST123',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: createResult, error: createError } = await supabaseHelpers.createDoctor(testDoctor);
    
    if (createError) {
      console.error('❌ Doctor creation failed:', createError);
      return { success: false, error: `Doctor creation error: ${createError.message}` };
    }
    console.log('✅ Doctor creation successful:', createResult);
    
    // Clean up test data
    console.log('4. Cleaning up test data...');
    await supabase.from('doctors').delete().eq('id', 'test-id-12345');
    console.log('✅ Test cleanup complete');
    
    return { success: true, message: 'All database tests passed!' };
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return { success: false, error: error.message };
  }
};

// Call this function in your browser console to test
window.testDatabaseSetup = testDatabaseSetup;
