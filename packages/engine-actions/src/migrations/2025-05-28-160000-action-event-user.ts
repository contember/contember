import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE actions_event
ADD COLUMN IF NOT EXISTS identity_id UUID DEFAULT NULL;

ALTER TABLE actions_event
ADD COLUMN IF NOT EXISTS ip_address INET DEFAULT NULL;

ALTER TABLE actions_event
ADD COLUMN IF NOT EXISTS user_agent TEXT DEFAULT NULL;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
