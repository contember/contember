CREATE SCHEMA "empty";
CREATE SCHEMA "tenant";

SET search_path = "empty";

CREATE TABLE "tenant"."identity" (
	"id" uuid NOT NULL,
	"parent_id" uuid,
	"roles" jsonb NOT NULL,
	CONSTRAINT "identity_id" PRIMARY KEY ("id"),
	CONSTRAINT "identity_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "tenant"."identity"("id")
);

CREATE INDEX "identity_parent_id" ON "tenant"."identity" USING btree ("parent_id");


CREATE TABLE "tenant"."api_key" (
	"id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"type" text NOT NULL,
	"identity_id" uuid NOT NULL,
	"enabled" boolean NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "api_key_id" PRIMARY KEY ("id"),
	CONSTRAINT "api_key_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "tenant"."identity"("id")
);

CREATE INDEX "api_key_identity_id" ON "tenant"."api_key" USING btree ("identity_id");


CREATE TABLE "tenant"."person" (
	"id" uuid NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"identity_id" uuid NOT NULL,
	CONSTRAINT "person_id" PRIMARY KEY ("id"),
	CONSTRAINT "person_identity_id_fkey" FOREIGN KEY ("identity_id") REFERENCES "tenant"."identity"("id")
);

CREATE INDEX "person_identity_id" ON "tenant"."api_key" USING btree ("identity_id");


CREATE TABLE "tenant"."project" (
	"id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "project_id" PRIMARY KEY ("id")
);


CREATE TABLE "tenant"."project_member" (
	"id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	CONSTRAINT "project_member_id" PRIMARY KEY ("id"),
	CONSTRAINT "project_member_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tenant"."project"("id"),
	CONSTRAINT "project_member_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "tenant"."person"("id")
);

CREATE UNIQUE INDEX project_member_project_id_person_id ON "tenant"."project_member" ("project_id", "person_id");
CREATE INDEX "project_member_person_id" ON "tenant"."project_member" ("person_id");
