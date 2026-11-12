ALTER TABLE matchCorrections ADD COLUMN 'ipCountry' TEXT DEFAULT NULL;

UPDATE matchCorrections SET ipCountry = meta ->> 'ipCountry';

/* rollback
  ALTER TABLE matchCorrections DROP COLUMN 'ipCountry';
*/
