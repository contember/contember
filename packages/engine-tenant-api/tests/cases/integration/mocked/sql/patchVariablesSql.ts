import { SQL } from '../../../../src/tags'
import { ExpectedQuery } from '@contember/database-tester'

export const patchVariablesSql = (args: {
	membershipId: string
	variableName: string
	values: string[]
	removeValues?: string[]
	id: string
}): ExpectedQuery => ({
	sql: SQL`
		WITH
		"current" AS
		    (SELECT jsonb_array_elements_text(value) AS "value"
    		FROM "tenant"."project_membership_variable"
    		WHERE "membership_id" = ? AND "variable" = ?),
		"filtered" AS
		    (SELECT * FROM "current" WHERE NOT(${args.removeValues ? '"value" in (?)' : 'false'})),
		"new" AS
		    (SELECT coalesce(jsonb_agg(filtered.value), '[]'::JSONB) || to_jsonb(?::TEXT[]) AS "value"
		    FROM "filtered")
		INSERT INTO "tenant"."project_membership_variable"
		    ("id", "membership_id", "variable", "value")
		    SELECT ?, ?, ?, "new"."value"
		FROM "new"
		ON CONFLICT ("membership_id", "variable")
		    DO UPDATE SET "value" = "excluded"."value"
		RETURNING "value"`,
	parameters: [
		args.membershipId,
		args.variableName,
		...(args.removeValues ? args.removeValues : []),
		args.values,
		args.id,
		args.membershipId,
		args.variableName,
	],
	response: {
		rows: [args.values],
	},
})
