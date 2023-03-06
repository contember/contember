import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TABLE project_secret
(
	id              UUID        NOT NULL PRIMARY KEY,
	project_id      UUID        NOT NULL,
	key             TEXT        NOT NULL,
	value_encrypted TEXT        NOT NULL,
	iv              TEXT        NOT NULL,
	created_at      TIMESTAMPTZ NOT NULL,
	updated_at      TIMESTAMPTZ NOT NULL,
	CONSTRAINT project_secret_project FOREIGN KEY (project_id) REFERENCES project (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX project_secret_unique ON project_secret (project_id, key);
CREATE INDEX project_secret_project_index
	ON project_secret (project_id);
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
