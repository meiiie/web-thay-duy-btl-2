-- =========================================
-- Fix Database Issues (PostgreSQL)
-- Idempotent & safer version
-- =========================================

BEGIN;

-- 0) (Tùy chọn) Đảm bảo cột roster.cccd tồn tại và có cùng kiểu
-- Nếu đã có thì bỏ qua phần này.
-- ALTER TABLE roster ADD COLUMN IF NOT EXISTS cccd VARCHAR(12) PRIMARY KEY;

-- 1) Tạo bảng votes nếu chưa có
CREATE TABLE IF NOT EXISTS votes (
  id         SERIAL PRIMARY KEY,
  cccd       VARCHAR(12) NOT NULL,
  candidate  VARCHAR(255) NOT NULL,
  voted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT votes_cccd_fk
    FOREIGN KEY (cccd) REFERENCES roster(cccd) ON UPDATE CASCADE ON DELETE RESTRICT,
  -- 1 người chỉ được 1 phiếu:
  CONSTRAINT votes_unique_voter UNIQUE (cccd),
  -- Đảm bảo định dạng CCCD là 12 chữ số
  CONSTRAINT votes_cccd_format_chk CHECK (cccd ~ '^[0-9]{12}$')
);

-- 1.1) Nếu trước đây đã dùng tên cột "time", đổi sang "voted_at"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'votes' AND column_name = 'time'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'votes' AND column_name = 'voted_at'
  ) THEN
    EXECUTE 'ALTER TABLE votes RENAME COLUMN "time" TO voted_at';
  END IF;
END $$;

-- 2) Tắt RLS cho các bảng (nếu tồn tại)
ALTER TABLE IF EXISTS roster     DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS votes      DISABLE ROW LEVEL SECURITY;

-- 3) Indexes (idempotent)
-- Lưu ý: đã có UNIQUE (cccd) → tự là index duy nhất; vẫn tạo thêm index cho candidate để truy vấn nhanh.
CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate);
CREATE INDEX IF NOT EXISTS idx_votes_voted_at  ON votes(voted_at);

-- 4) Dữ liệu mẫu (tránh trùng bằng ON CONFLICT trên (cccd))
INSERT INTO votes (cccd, candidate)
VALUES
  ('123456789012', 'Nguyen Van X'),
  ('123456789013', 'Nguyen Van X'),
  ('123456789014', 'Tran Thi Y')
ON CONFLICT (cccd) DO NOTHING;

COMMIT;

-- 5) Kiểm tra số lượng bản ghi mỗi bảng
SELECT 'roster' AS table_name, COUNT(*) AS count FROM roster
UNION ALL
SELECT 'attendance' AS table_name, COUNT(*) AS count FROM attendance
UNION ALL
SELECT 'votes' AS table_name, COUNT(*) AS count FROM votes;

-- 6) (Tùy chọn) Kiểm tra nhanh các phiếu hợp lệ (FK khớp roster)
-- SELECT v.* FROM votes v LEFT JOIN roster r USING (cccd) WHERE r.cccd IS NULL;

-- Copy và chạy script này trong Supabase SQL Editor
 INSERT INTO roster (cccd, hoten, mssv) VALUES
('031304008740', 'Phạm Thị Minh Hồng', 'SV006')
ON CONFLICT (cccd) DO NOTHING;

INSERT INTO attendance (cccd) VALUES
('031304008740')
ON CONFLICT DO NOTHING;

-- Trong Supabase SQL Editor
ALTER TABLE votes
ADD CONSTRAINT votes_cccd_fk
FOREIGN KEY (cccd) REFERENCES roster(cccd)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE attendance
ADD CONSTRAINT attendance_cccd_fk
FOREIGN KEY (cccd) REFERENCES roster(cccd)
ON DELETE CASCADE ON UPDATE CASCADE;

DELETE FROM codes WHERE cccd = '014204000019';

CREATE TABLE candidates (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
position VARCHAR(255) NOT NULL,
description TEXT,
active BOOLEAN DEFAULT true,
created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS image_url TEXT;

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
DROP TABLE IF EXISTS codes CASCADE;