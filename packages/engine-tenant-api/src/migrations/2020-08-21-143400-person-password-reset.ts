import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TABLE person_password_reset (
	id         UUID      NOT NULL,
	token_hash TEXT      NOT NULL,
	person_id  UUID      NOT NULL,
	expires_at TIMESTAMP NOT NULL,
	created_at TIMESTAMP NOT NULL,
	used_at    TIMESTAMP,
	CONSTRAINT person_password_reset_id PRIMARY KEY ("id"),
	CONSTRAINT person_password_reset_person FOREIGN KEY ("person_id")
		REFERENCES person("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX person_password_reset_token
	ON person_password_reset(token_hash);
`


export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
