-- Add images and permissions support to the database

-- Add images table to store extracted images from Excel files
CREATE TABLE IF NOT EXISTS document_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER,
  extracted_from VARCHAR(500),
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_document_images_document_id ON document_images(document_id);

-- Add permission fields to access_requests table
ALTER TABLE access_requests 
ADD COLUMN IF NOT EXISTS can_view_content BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS can_view_document BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS can_download_original BOOLEAN DEFAULT FALSE;

-- Update documents table to ensure original_file_url column exists
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS original_file_url TEXT,
ADD COLUMN IF NOT EXISTS original_file_size INTEGER;

COMMENT ON TABLE document_images IS 'Stores images extracted from uploaded Excel documents';
COMMENT ON COLUMN access_requests.can_view_content IS 'Permission to view parsed content (samples, analysis)';
COMMENT ON COLUMN access_requests.can_view_document IS 'Permission to view/download original document';
COMMENT ON COLUMN access_requests.can_download_original IS 'Permission to download original Excel file';
