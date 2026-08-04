\c db_inventory;

-- 1. Bật extension hỗ trợ tìm kiếm có dấu / ký tự mờ (Trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;