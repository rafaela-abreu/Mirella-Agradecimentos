CREATE TABLE IF NOT EXISTS gallery_photos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT 'Foto da festa',
  file_url VARCHAR(1024) NOT NULL,
  storage_key VARCHAR(512) NULL,
  original_name VARCHAR(255) NULL,
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gallery_published_created (is_published, created_at)
);
