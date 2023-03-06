import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE UNIQUE INDEX api_key_token_hash ON api_key(token_hash)
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}

