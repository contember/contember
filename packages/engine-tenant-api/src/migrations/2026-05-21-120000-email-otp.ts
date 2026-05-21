import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TYPE "person_token_type" ADD VALUE 'mfa_email_otp';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
