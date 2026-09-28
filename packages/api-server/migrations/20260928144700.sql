DROP INDEX IF EXISTS idx_uniq_titles;

ALTER TABLE titles DROP COLUMN 'site';

ALTER TABLE titles ADD COLUMN 'site' TEXT DEFAULT 'netflix';

CREATE UNIQUE INDEX idx_uniq_titles
ON titles(title, type, year, site);
