import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'idp_logout_initiated';
ALTER TYPE "auth_log_type" ADD VALUE IF NOT EXISTS 'idp_backchannel_logout';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
