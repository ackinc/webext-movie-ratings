ALTER TABLE titles ADD COLUMN 'matchedBy' TEXT;

UPDATE titles SET matchedBy = 'system' WHERE status = 'matched';