import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE config
	ADD COLUMN login_anomaly_missing_signal_is_new BOOLEAN NOT NULL DEFAULT FALSE;
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
