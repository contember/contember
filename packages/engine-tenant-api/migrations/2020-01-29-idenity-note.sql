ALTER TABLE tenant.identity
    ADD COLUMN description TEXT,
    ADD COLUMN created_at  TIMESTAMP;

UPDATE tenant.identity
SET created_at = NOW();

ALTER TABLE tenant.identity
    ALTER created_at SET NOT NULL;
