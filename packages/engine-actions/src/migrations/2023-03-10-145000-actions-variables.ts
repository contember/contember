import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
    CREATE TABLE actions_variable
    (
        id              UUID PRIMARY KEY NOT NULL,
        created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
        name            TEXT             NOT NULL UNIQUE,
        value           TEXT             NOT NULL
    )
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
