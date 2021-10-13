ALTER TABLE identity
    ADD COLUMN description TEXT,
    ADD COLUMN created_at  TIMESTAMP;

UPDATE identity
SET created_at = NOW();

ALTER TABLE identity
    ALTER created_at SET NOT NULL;
