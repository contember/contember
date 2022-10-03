import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "mail_template" ALTER COLUMN "project_id" DROP NOT NULL;

DROP INDEX mail_template_identifier;

CREATE UNIQUE INDEX mail_template_identifier
	ON mail_template (project_id, mail_type, variant) WHERE project_id IS NOT NULL;

CREATE UNIQUE INDEX mail_template_identifier_global
	ON mail_template (mail_type, variant) WHERE project_id IS NULL;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
