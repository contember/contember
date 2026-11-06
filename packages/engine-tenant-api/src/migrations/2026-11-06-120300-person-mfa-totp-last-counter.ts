import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE person_mfa
	ADD COLUMN totp_last_counter BIGINT;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
