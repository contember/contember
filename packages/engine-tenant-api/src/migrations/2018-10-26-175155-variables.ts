import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TABLE "project_member_variable" (
  "id"          uuid    NOT NULL,
  "project_id"  uuid    NOT NULL,
  "identity_id" uuid    NOT NULL,
  "variable"    text    NOT NULL,
  "values"      text [] NOT NULL,
  CONSTRAINT project_member_variable_project_id FOREIGN KEY ("project_id")
  REFERENCES "project" ("id")
  ON DELETE CASCADE,
  CONSTRAINT project_member_variable_identity_id FOREIGN KEY ("identity_id")
  REFERENCES "identity" ("id")
  ON DELETE CASCADE,
  CONSTRAINT project_member_variable_unique UNIQUE ("project_id", "identity_id", "variable")
);
`
export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
