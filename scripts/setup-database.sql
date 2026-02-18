-- Kansai Altan Analysis Lab Management System Database Setup
-- PostgreSQL Database Schema

-- Drop existing tables if they exist
DROP TABLE IF EXISTS document_footnotes CASCADE;
DROP TABLE IF EXISTS access_requests CASCADE;
DROP TABLE IF EXISTS samples CASCADE;
DROP TABLE IF EXISTS document_notes CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  lab VARCHAR(50) NOT NULL CHECK (lab IN ('analiz', 'proses', 'otomotiv', 'admin')),
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'analiz_member', 'lab_member')),
  department VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(500) NOT NULL,
  title VARCHAR(500) NOT NULL,
  original_file_url TEXT,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  sample_count INTEGER DEFAULT 0,
  analysis_types TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Create document notes table
CREATE TABLE document_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create samples table
CREATE TABLE samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  name VARCHAR(500) NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::JSONB,
  comment TEXT
);

-- Create document footnotes table
CREATE TABLE document_footnotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

-- Create access requests table
CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_name VARCHAR(255) NOT NULL,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_title VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requester_note TEXT,
  responder_id UUID REFERENCES users(id) ON DELETE SET NULL,
  responder_name VARCHAR(255),
  responder_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP WITH TIME ZONE
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('access_request', 'request_approved', 'request_rejected')),
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  related_request_id UUID REFERENCES access_requests(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_lab ON users(lab);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_document_notes_document_id ON document_notes(document_id);
CREATE INDEX idx_samples_document_id ON samples(document_id);
CREATE INDEX idx_document_footnotes_document_id ON document_footnotes(document_id);
CREATE INDEX idx_access_requests_requester_id ON access_requests(requester_id);
CREATE INDEX idx_access_requests_document_id ON access_requests(document_id);
CREATE INDEX idx_access_requests_status ON access_requests(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Insert default users (password: lab123456)
INSERT INTO users (email, password_hash, name, lab, role, department) VALUES
  ('admin@kansaialtan.com', '$2a$10$UpJ6MoCPM5vUmds3hYOuku04R1WhVK2E7ms1PvlDCiZJquQiJ.qG6', 'Admin Kullanıcı', 'admin', 'admin', 'Yönetim'),
  ('analiz1@kansaialtan.com', '$2a$10$UpJ6MoCPM5vUmds3hYOuku04R1WhVK2E7ms1PvlDCiZJquQiJ.qG6', 'Analiz Uzmanı 1', 'analiz', 'analiz_member', 'Analiz Laboratuvarı'),
  ('analiz2@kansaialtan.com', '$2a$10$UpJ6MoCPM5vUmds3hYOuku04R1WhVK2E7ms1PvlDCiZJquQiJ.qG6', 'Analiz Uzmanı 2', 'analiz', 'analiz_member', 'Analiz Laboratuvarı'),
  ('proses@kansaialtan.com', '$2a$10$UpJ6MoCPM5vUmds3hYOuku04R1WhVK2E7ms1PvlDCiZJquQiJ.qG6', 'Proses Mühendisi', 'proses', 'lab_member', 'Proses Laboratuvarı'),
  ('otomotiv@kansaialtan.com', '$2a$10$UpJ6MoCPM5vUmds3hYOuku04R1WhVK2E7ms1PvlDCiZJquQiJ.qG6', 'Otomotiv Uzmanı', 'otomotiv', 'lab_member', 'Otomotiv Laboratuvarı');

-- Create a trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a trigger to notify analysis lab members when a new access request is created
CREATE OR REPLACE FUNCTION notify_analysis_lab_on_request()
RETURNS TRIGGER AS $$
DECLARE
  analysis_user RECORD;
BEGIN
  -- Notify all analysis lab members
  FOR analysis_user IN 
    SELECT id, name FROM users WHERE role IN ('admin', 'analiz_member')
  LOOP
    INSERT INTO notifications (user_id, type, title, message, related_request_id)
    VALUES (
      analysis_user.id,
      'access_request',
      'Yeni Erişim İsteği',
      NEW.requester_name || ' tarafından "' || NEW.document_title || '" dökümanı için erişim izni talep edildi.',
      NEW.id
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_access_request
AFTER INSERT ON access_requests
FOR EACH ROW EXECUTE FUNCTION notify_analysis_lab_on_request();

-- Create a trigger to notify requester when their request is responded
CREATE OR REPLACE FUNCTION notify_requester_on_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO notifications (user_id, type, title, message, related_request_id)
    VALUES (
      NEW.requester_id,
      CASE WHEN NEW.status = 'approved' THEN 'request_approved' ELSE 'request_rejected' END,
      CASE WHEN NEW.status = 'approved' THEN 'Erişim İsteği Onaylandı' ELSE 'Erişim İsteği Reddedildi' END,
      '"' || NEW.document_title || '" dökümanı için erişim isteğiniz ' || 
      CASE WHEN NEW.status = 'approved' THEN 'onaylandı.' ELSE 'reddedildi.' END ||
      CASE WHEN NEW.responder_note IS NOT NULL THEN ' Not: ' || NEW.responder_note ELSE '' END,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_on_request_response
AFTER UPDATE ON access_requests
FOR EACH ROW EXECUTE FUNCTION notify_requester_on_response();

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
