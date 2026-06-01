import { SQL } from '../../../../src/tags.js'
import { ExpectedQuery } from '@contember/database-tester'

export const createMembershipVariableSql = (args: {
	variableId: string
	membershipId: string
	variableName: string
	values: string[]
}): ExpectedQuery => ({
	sql: SQL`INSERT INTO "tenant"."project_membership_variable" ("id", "membership_id", "variable", "value")
	         VALUES (?, ?, ?, ?)
	         ON CONFLICT ("membership_id", "variable") DO UPDATE SET "value" = ?`,
	parameters: [
		args.variableId,
		args.membershipId,
		args.variableName,
		JSON.stringify(args.values),
		JSON.stringify(args.values),
	],
	response: {
		rowCount: 1,
	},
})
