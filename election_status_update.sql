-- =========================================
-- Election Status Management - Update Script
-- =========================================

BEGIN;

-- Tạo bảng election_status để quản lý trạng thái cuộc bầu cử
CREATE TABLE IF NOT EXISTS election_status (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  ended_at TIMESTAMPTZ NULL,
  results_published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT election_status_status_chk CHECK (status IN ('active', 'ended', 'results_published'))
);

-- Tắt RLS cho bảng election_status
ALTER TABLE election_status DISABLE ROW LEVEL SECURITY;

-- Thêm index cho status
CREATE INDEX IF NOT EXISTS idx_election_status_status ON election_status(status);

-- Insert default election status nếu chưa có
INSERT INTO election_status (status) 
VALUES ('active')
ON CONFLICT DO NOTHING;

-- Tạo function để update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tạo trigger để tự động update updated_at
DROP TRIGGER IF EXISTS update_election_status_updated_at ON election_status;
CREATE TRIGGER update_election_status_updated_at
    BEFORE UPDATE ON election_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Kiểm tra bảng election_status
SELECT * FROM election_status;