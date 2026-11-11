CREATE TABLE suggested_irr_corrections (
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

CREATE TRIGGER update_suggested_irr_corrections_updatedAt
AFTER UPDATE ON "suggested_irr_corrections"
FOR EACH ROW
BEGIN
  UPDATE "suggested_irr_corrections" SET "updatedAt" = CURRENT_TIMESTAMP
  WHERE "id" = OLD."id";
END;

/* rollback
  DROP TRIGGER update_suggested_irr_corrections_updatedAt;
  DROP TABLE suggested_irr_corrections;
*/
