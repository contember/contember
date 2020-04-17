DROP INDEX "person_identity_id";

CREATE INDEX "person_identity_id" ON "tenant"."person" USING btree ("identity_id");
