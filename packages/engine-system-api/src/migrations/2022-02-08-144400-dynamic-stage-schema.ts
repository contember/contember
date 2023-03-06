import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE stage
	ADD COLUMN schema TEXT UNIQUE;
UPDATE stage
SET schema = 'stage_' || slug;
ALTER TABLE stage
	ALTER schema SET NOT NULL;

CREATE OR REPLACE FUNCTION trigger_event_commit() RETURNS TRIGGER AS
$$
BEGIN
	PERFORM PG_ADVISORY_XACT_LOCK(5218230332970456493); -- well-known random number

	CASE WHEN
			NULLIF(CURRENT_SETTING('system.transaction_id', TRUE), '') IS NOT NULL
			AND NULLIF(CURRENT_SETTING('system.transaction_inserted', TRUE), '') IS NULL
		THEN
			INSERT INTO stage_transaction(transaction_id, stage_id, applied_at)
			VALUES (CURRENT_SETTING('system.transaction_id')::UUID,
					(
						SELECT id
						FROM stage
						WHERE schema = TG_TABLE_SCHEMA
					),
					CLOCK_TIMESTAMP())
			ON CONFLICT DO NOTHING;

			PERFORM SET_CONFIG('system.transaction_inserted', '1', TRUE);
		ELSE
		-- do nothing
		END CASE;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;

DO LANGUAGE plpgsql
$$
	BEGIN
		EXECUTE FORMAT('ALTER FUNCTION trigger_event_commit() SET SEARCH_PATH = %s', QUOTE_IDENT(CURRENT_SCHEMA()));
	END
$$
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
