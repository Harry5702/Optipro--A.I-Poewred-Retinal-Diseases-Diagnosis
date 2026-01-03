-- Supabase Database Schema for OptiPro Eye Disease Detection System
-- Execute these commands in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- In production, this should be hashed
    specialization VARCHAR(100),
    license_number VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Patient Users table for authentication
CREATE TABLE IF NOT EXISTS patient_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- In production, this should be hashed
    phone VARCHAR(20),
    age INTEGER,
    gender VARCHAR(20),
    address TEXT,
    medical_history TEXT,
    emergency_contact VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Patients table (linked to doctors for actual treatment)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_user_id UUID REFERENCES patient_users(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    age INTEGER,
    gender VARCHAR(20),
    address TEXT,
    medical_history TEXT,
    emergency_contact VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Retinal Scans table
CREATE TABLE IF NOT EXISTS retinal_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    diagnosis VARCHAR(50) NOT NULL, -- CNV, DME, DRUSEN, NORMAL
    confidence DECIMAL(5,2), -- Percentage confidence (0.00 to 100.00)
    image_url TEXT, -- URL to the original retinal image
    heatmap_url TEXT, -- URL to the heatmap image
    doctor_notes TEXT,
    scan_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_users_email ON patient_users(email);
CREATE INDEX IF NOT EXISTS idx_patients_doctor_id ON patients(doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_user_id ON patients(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_retinal_scans_patient_id ON retinal_scans(patient_id);
CREATE INDEX IF NOT EXISTS idx_retinal_scans_doctor_id ON retinal_scans(doctor_id);
CREATE INDEX IF NOT EXISTS idx_retinal_scans_scan_date ON retinal_scans(scan_date);
CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at column
CREATE TRIGGER update_doctors_updated_at 
    BEFORE UPDATE ON doctors 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_users_updated_at 
    BEFORE UPDATE ON patient_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at 
    BEFORE UPDATE ON patients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retinal_scans_updated_at 
    BEFORE UPDATE ON retinal_scans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create Row Level Security (RLS) policies
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE retinal_scans ENABLE ROW LEVEL SECURITY;

-- Doctors can only see and modify their own records
CREATE POLICY "Doctors can view their own profile" ON doctors
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Doctors can update their own profile" ON doctors
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Patient users can view and update their own profile
CREATE POLICY "Patient users can view their own profile" ON patient_users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Patient users can update their own profile" ON patient_users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow public to insert patient users (for registration)
CREATE POLICY "Anyone can create patient accounts" ON patient_users
    FOR INSERT WITH CHECK (true);

-- Doctors can only see and modify their own patients
CREATE POLICY "Doctors can view their own patients" ON patients
    FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can insert patients" ON patients
    FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own patients" ON patients
    FOR UPDATE USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can delete their own patients" ON patients
    FOR DELETE USING (doctor_id = auth.uid());

-- Doctors can only see and modify scans for their own patients
CREATE POLICY "Doctors can view their patients' scans" ON retinal_scans
    FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can insert scans for their patients" ON retinal_scans
    FOR INSERT WITH CHECK (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their patients' scans" ON retinal_scans
    FOR UPDATE USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can delete their patients' scans" ON retinal_scans
    FOR DELETE USING (doctor_id = auth.uid());

-- Create a view for patient statistics
CREATE OR REPLACE VIEW patient_stats AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.age,
    p.gender,
    p.doctor_id,
    p.created_at,
    COUNT(rs.id) as total_scans,
    MAX(rs.scan_date) as last_scan_date,
    COUNT(CASE WHEN rs.diagnosis = 'NORMAL' THEN 1 END) as normal_scans,
    COUNT(CASE WHEN rs.diagnosis = 'CNV' THEN 1 END) as cnv_scans,
    COUNT(CASE WHEN rs.diagnosis = 'DME' THEN 1 END) as dme_scans,
    COUNT(CASE WHEN rs.diagnosis = 'DRUSEN' THEN 1 END) as drusen_scans
FROM patients p
LEFT JOIN retinal_scans rs ON p.id = rs.patient_id
GROUP BY p.id, p.full_name, p.email, p.phone, p.age, p.gender, p.doctor_id, p.created_at;

-- Insert sample data (optional - for testing)
-- Note: In production, passwords should be properly hashed

INSERT INTO doctors (id, full_name, email, password, specialization, license_number) 
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Dr. Sarah Johnson', 'sarah.johnson@optipro.com', 'password123', 'Ophthalmologist', 'MD12345'),
    ('550e8400-e29b-41d4-a716-446655440001', 'Dr. Michael Chen', 'michael.chen@optipro.com', 'password123', 'Retinal Specialist', 'MD67890')
ON CONFLICT (id) DO NOTHING;

INSERT INTO patients (id, doctor_id, full_name, email, phone, age, gender, address, medical_history) 
VALUES 
    ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', 'John Smith', 'john.smith@email.com', '+1-555-0101', 65, 'Male', '123 Main St, City, State 12345', 'Diabetes Type 2, Hypertension'),
    ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Mary Wilson', 'mary.wilson@email.com', '+1-555-0102', 58, 'Female', '456 Oak Ave, City, State 12345', 'Family history of AMD'),
    ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Robert Davis', 'robert.davis@email.com', '+1-555-0103', 72, 'Male', '789 Pine St, City, State 12345', 'Previous retinal detachment')
ON CONFLICT (id) DO NOTHING;

-- Create Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    patient_user_id UUID NOT NULL REFERENCES patient_users(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason_for_visit TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, rejected, cancelled, completed
    doctor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- new_appointment, appointment_reminder, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_user_id ON appointments(patient_user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_doctor_id ON notifications(doctor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Create triggers to automatically update updated_at column
CREATE TRIGGER update_appointments_updated_at 
    BEFORE UPDATE ON appointments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Doctors can only see and modify their own appointments
CREATE POLICY "Doctors can view their own appointments" ON appointments
    FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own appointments" ON appointments
    FOR UPDATE USING (doctor_id = auth.uid());

-- Patients can view and create their own appointments
CREATE POLICY "Patients can view their own appointments" ON appointments
    FOR SELECT USING (patient_user_id = auth.uid());

CREATE POLICY "Patients can create appointments" ON appointments
    FOR INSERT WITH CHECK (patient_user_id = auth.uid());

-- Doctors can only see their own notifications
CREATE POLICY "Doctors can view their own notifications" ON notifications
    FOR SELECT USING (doctor_id = auth.uid());

CREATE POLICY "Doctors can update their own notifications" ON notifications
    FOR UPDATE USING (doctor_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Create storage buckets for images (Run this in Supabase Dashboard -> Storage)
-- These commands should be run in the Supabase Dashboard, not in SQL editor:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create bucket: "retinal-images" (public)
-- 3. Create bucket: "heatmap-images" (public)

-- Note: Storage bucket creation is typically done through the Supabase Dashboard UI
-- You can also use the storage API or SQL functions, but the Dashboard is easier

COMMENT ON TABLE doctors IS 'Stores doctor/physician information and credentials';
COMMENT ON TABLE patients IS 'Stores patient information linked to their assigned doctor';
COMMENT ON TABLE retinal_scans IS 'Stores retinal scan results and analysis data';
COMMENT ON TABLE appointments IS 'Stores appointment bookings from patients to doctors';
COMMENT ON TABLE notifications IS 'Stores notifications for doctors about appointments and other events';
COMMENT ON VIEW patient_stats IS 'Aggregated statistics for each patient including scan counts';
