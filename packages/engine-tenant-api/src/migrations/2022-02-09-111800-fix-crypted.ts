import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE project_secret
	ADD COLUMN value   BYTEA,
	ADD COLUMN version SMALLINT;

UPDATE project_secret SET
	value = DECODE(value_encrypted, 'base64') || DECODE(iv, 'base64'),
	version = 1;

ALTER TABLE project_secret
    ALTER value SET NOT NULL,
    ALTER version SET NOT NULL,
    DROP value_encrypted,
    DROP iv;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
