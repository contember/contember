import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TABLE person_identity_provider
(
	id                   UUID        NOT NULL PRIMARY KEY,
	person_id            UUID        NOT NULL,
	identity_provider_id UUID        NOT NULL,
	created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
	external_identifier  TEXT        NOT NULL,
	CONSTRAINT person_identity_provider_person FOREIGN KEY (person_id) REFERENCES person (id) ON DELETE CASCADE,
	CONSTRAINT person_identity_provider_idp FOREIGN KEY (identity_provider_id) REFERENCES identity_provider (id) ON DELETE CASCADE
);

CREATE INDEX person_identity_provider_person_id ON person_identity_provider (person_id);
CREATE UNIQUE INDEX person_identity_provider_identifier
	ON person_identity_provider (identity_provider_id, external_identifier);
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
