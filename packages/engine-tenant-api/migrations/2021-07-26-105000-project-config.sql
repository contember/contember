ALTER TABLE tenant.project
	ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::JSONB,
    add column updated_at timestamptz not null DEFAULT now();
