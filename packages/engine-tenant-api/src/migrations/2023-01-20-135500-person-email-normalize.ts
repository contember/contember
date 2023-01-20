import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
WITH
	normalized AS (
		SELECT id, email, REGEXP_REPLACE(LOWER(email), '\s', '', 'g') AS normalized
		FROM person
	),
	not_exist AS (
		SELECT *
		FROM normalized
		 WHERE NOT EXISTS(SELECT FROM person WHERE person.email = normalized.normalized)
	),
	uniq AS (
		SELECT DISTINCT ON (normalized) *
		FROM not_exist
		ORDER BY normalized
	)
UPDATE person
SET email = uniq.normalized
FROM uniq
WHERE person.id = uniq.id;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}

