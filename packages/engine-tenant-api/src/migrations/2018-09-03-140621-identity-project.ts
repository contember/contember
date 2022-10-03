import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
ALTER TABLE "project_member"
  ADD COLUMN "identity_id" UUID DEFAULT NULL,
  ADD COLUMN "roles" jsonb NOT NULL DEFAULT '[]' :: jsonb;

CREATE INDEX "project_member_identity_id"
  ON "project_member" ("identity_id");

CREATE UNIQUE INDEX "project_member_project_identity"
  ON "project_member" ("project_id", "identity_id");

ALTER TABLE "project_member"
  ADD CONSTRAINT "project_member_identity" FOREIGN KEY ("identity_id") REFERENCES "identity" ("id") ON DELETE CASCADE;

UPDATE "project_member"
SET "identity_id" = "person"."identity_id"
FROM "person"
WHERE "person"."id" = "project_member"."person_id";
DROP INDEX "project_member_person_id";

ALTER TABLE "project_member"
  DROP "person_id",
  ALTER "roles" DROP DEFAULT,
  ALTER "identity_id" DROP DEFAULT,
  ALTER "identity_id" SET NOT NULL;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
