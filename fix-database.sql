-- Add missing columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS birth_time TIME,
ADD COLUMN IF NOT EXISTS birth_place TEXT,
ADD COLUMN IF NOT EXISTS question TEXT,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS scheduled_date DATE,
ADD COLUMN IF NOT EXISTS scheduled_time TIME,
ADD COLUMN IF NOT EXISTS session_type TEXT,
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_booking TIMESTAMP WITH TIME ZONE;

-- Update existing test client with required fields
UPDATE clients 
SET 
    birth_date = '1990-01-01',
    birth_place = 'Test City, Test Country',
    question = 'Test question for development purposes',
    language = 'en'
WHERE email = 'test@example.com';

-- Insert sample customers if they don't exist
INSERT INTO clients (name, email, phone, status, birth_date, birth_place, question, language, created_at)
VALUES 
    ('Maria Garcia', 'maria.garcia@example.com', '+1 (555) 123-4567', 'active', '1985-03-15', 'Madrid, Spain', 'I want to understand my relationship patterns and find true love. What does my chart reveal about my romantic destiny?', 'es', NOW()),
    ('John Smith', 'john.smith@example.com', '+1 (555) 234-5678', 'confirmed', '1990-07-22', 'New York, USA', 'I''m at a crossroads in my career. Should I stay in my current job or take the leap to start my own business?', 'en', NOW()),
    ('Ana Rodriguez', 'ana.rodriguez@example.com', '+1 (555) 345-6789', 'pending', '1988-11-08', 'Barcelona, Spain', 'I feel lost and don''t know my life purpose. What does my birth chart reveal about my spiritual journey?', 'es', NOW())
ON CONFLICT (email) DO NOTHING;
