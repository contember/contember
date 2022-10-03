import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "person"
	ADD COLUMN otp_uri          TEXT      DEFAULT NULL,
	ADD COLUMN otp_activated_at TIMESTAMP DEFAULT NULL
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}

