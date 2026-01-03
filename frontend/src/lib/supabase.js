import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key length:', supabaseAnonKey?.length);

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table schemas
export const TABLES = {
  DOCTORS: 'doctors',
  PATIENTS: 'patients',
  RETINAL_SCANS: 'retinal_scans'
}

// Helper functions for database operations
export const supabaseHelpers = {
  // Doctor operations
  async createDoctor(doctorData) {
    const { data, error } = await supabase
      .from(TABLES.DOCTORS)
      .insert([doctorData])
      .select()
    
    return { data: data?.[0], error }
  },

  async getDoctorByEmail(email) {
    const { data, error } = await supabase
      .from(TABLES.DOCTORS)
      .select('*')
      .eq('email', email)
      .limit(1)
    
    return { data: data?.[0] || null, error }
  },

  async loginDoctor(email, password) {
    const { data, error } = await supabase
      .from(TABLES.DOCTORS)
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .limit(1)
    
    return { data: data?.[0] || null, error }
  },

  async getAllDoctors() {
    const { data, error } = await supabase
      .from(TABLES.DOCTORS)
      .select('*')
      .order('created_at', { ascending: false })
    
    return { data: data || [], error }
  },

  // Grouped doctor operations for better organization
  doctors: {
    async getAll() {
      const { data, error } = await supabase
        .from(TABLES.DOCTORS)
        .select('*')
        .order('created_at', { ascending: false })
      
      return { data: data || [], error }
    },

    async getById(id) {
      const { data, error } = await supabase
        .from(TABLES.DOCTORS)
        .select('*')
        .eq('id', id)
        .limit(1)
      
      return { data: data?.[0] || null, error }
    }
  },

  // Patient operations
  async createPatient(patientData) {
    const { data, error } = await supabase
      .from(TABLES.PATIENTS)
      .insert([patientData])
      .select()
    
    return { data: data?.[0], error }
  },

  async getPatientsByDoctor(doctorId) {
    const { data, error } = await supabase
      .from(TABLES.PATIENTS)
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  async getPatientById(patientId) {
    const { data, error } = await supabase
      .from(TABLES.PATIENTS)
      .select('*')
      .eq('id', patientId)
      .single()
    
    return { data, error }
  },

  async updatePatient(patientId, updateData) {
    const { data, error } = await supabase
      .from(TABLES.PATIENTS)
      .update(updateData)
      .eq('id', patientId)
      .select()
    
    return { data: data?.[0], error }
  },

  async deletePatient(patientId) {
    const { data, error } = await supabase
      .from(TABLES.PATIENTS)
      .delete()
      .eq('id', patientId)
    
    return { data, error }
  },

  // Retinal scan operations
  async createRetinalScan(scanData) {
    const { data, error } = await supabase
      .from(TABLES.RETINAL_SCANS)
      .insert([scanData])
      .select()
    
    return { data: data?.[0], error }
  },

  async getRetinalScansByPatient(patientId) {
    const { data, error } = await supabase
      .from(TABLES.RETINAL_SCANS)
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  async getRetinalScanById(scanId) {
    const { data, error } = await supabase
      .from(TABLES.RETINAL_SCANS)
      .select('*')
      .eq('id', scanId)
      .single()
    
    return { data, error }
  },

  async deletePatientScans(patientId) {
    const { data, error } = await supabase
      .from(TABLES.RETINAL_SCANS)
      .delete()
      .eq('patient_id', patientId)
    
    return { data, error }
  },

  async deleteRetinalScan(scanId) {
    const { data, error } = await supabase
      .from(TABLES.RETINAL_SCANS)
      .delete()
      .eq('id', scanId)
    
    return { data, error }
  },

  // File upload to Supabase Storage
  async uploadImage(bucket, filePath, file) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    return { data, error }
  },

  async getImageUrl(bucket, filePath) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    return data.publicUrl
  }
}
