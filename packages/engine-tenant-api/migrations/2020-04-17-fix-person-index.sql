DROP INDEX "person_identity_id";

CREATE INDEX "person_identity_id" ON "person" USING btree ("identity_id");
