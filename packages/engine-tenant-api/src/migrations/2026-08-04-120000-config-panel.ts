import { MigrationBuilder } from '@contember/database-migrations'

// Who may enter the management panel. Defaults reproduce the pre-config
// behaviour (super admins and project admins), an empty list means nobody.
const sql = `
ALTER TABLE "config"
	ADD COLUMN "panel_global_roles"  TEXT[] NOT NULL DEFAULT '{super_admin,project_admin}',
	ADD COLUMN "panel_project_roles" TEXT[] NOT NULL DEFAULT '{admin}';
`

export default async function(builder: MigrationBuilder) {
	builder.sql(sql)
}
