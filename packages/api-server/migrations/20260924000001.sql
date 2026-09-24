CREATE TABLE IF NOT EXISTS titles_backup AS SELECT * FROM titles;

ALTER TABLE titles_backup ADD COLUMN site TEXT DEFAULT 'all';

CREATE UNIQUE INDEX idx_uniq_titles
ON titles_backup(title, type, year, site);

DROP TABLE IF EXISTS titles;

ALTER TABLE titles_backup RENAME TO titles;