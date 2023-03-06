import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TABLE mail_template (
	id         UUID NOT NULL PRIMARY KEY,
	project_id UUID NOT NULL,
	mail_type  TEXT NOT NULL,
	variant    TEXT NOT NULL,
	subject    TEXT NOT NULL,
	content    TEXT NOT NULL,
	use_layout BOOL NOT NULL,
	CONSTRAINT mail_template_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX mail_template_identifier ON mail_template(project_id, mail_type, variant);
CREATE INDEX mail_template_project_index
	ON mail_template(project_id);
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
