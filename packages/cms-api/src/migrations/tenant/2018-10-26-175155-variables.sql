CREATE TABLE "tenant"."project_member_variable" (
  "id"          uuid    NOT NULL,
  "project_id"  uuid    NOT NULL,
  "identity_id" uuid    NOT NULL,
  "variable"    text    NOT NULL,
  "values"      text [] NOT NULL,
  CONSTRAINT project_member_variable_project_id FOREIGN KEY ("project_id")
  REFERENCES "tenant"."project" ("id")
  ON DELETE CASCADE,
  CONSTRAINT project_member_variable_identity_id FOREIGN KEY ("identity_id")
  REFERENCES "tenant"."identity" ("id")
  ON DELETE CASCADE,
  CONSTRAINT project_member_variable_unique UNIQUE ("project_id", "identity_id", "variable")
);
