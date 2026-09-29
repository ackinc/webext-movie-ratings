ALTER TABLE titles ADD COLUMN 'matchedBy' TEXT;

ALTER TABLE titles
ADD CONSTRAINT check_titles_matchedBy CHECK (matchedBy in ('system', 'admin'));

UPDATE titles SET matchedBy = 'system' WHERE status = 'matched';