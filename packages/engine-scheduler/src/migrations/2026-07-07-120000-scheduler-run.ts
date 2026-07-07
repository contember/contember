import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
	CREATE TABLE scheduler_run
	(
		project      TEXT        NOT NULL,
		job_name     TEXT        NOT NULL,
		stage        TEXT        NOT NULL DEFAULT '',
		last_run_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		last_status  TEXT        NOT NULL,
		PRIMARY KEY (project, job_name, stage)
	);
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
