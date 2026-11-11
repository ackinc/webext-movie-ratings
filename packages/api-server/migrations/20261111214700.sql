CREATE TABLE matchCorrections (
  "id" INTEGER NOT NULL,
  "titleId" INTEGER NOT NULL,
  "suggestedImdbId" DEFAULT NULL, -- if user selects NOTA
  "ipHash" TEXT NOT NULL,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "meta" TEXT,
  PRIMARY KEY("id"),
  FOREIGN KEY (titleId) REFERENCES titles(id)
);

CREATE TRIGGER update_matchCorrections_updatedAt
AFTER UPDATE ON "matchCorrections"
FOR EACH ROW
BEGIN
  UPDATE "matchCorrections" SET "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = OLD."id";
END;

/* rollback
  DROP TRIGGER update_matchCorrections_updatedAt;
  DROP TABLE matchCorrections;
*/
