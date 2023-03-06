import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
DROP INDEX "person_identity_id";

CREATE INDEX "person_identity_id" ON "person" USING btree ("identity_id");
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}

