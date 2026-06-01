import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

export const getPersonsByIdentitySql = (args: {
	identityIds: readonly string[]
	response: readonly { personId: string; identityId: string; email: string; password?: string; roles?: readonly string[] }[]
}): ExpectedQuery => ({
	sql:
		SQL`SELECT "person"."id", "person"."password_hash", "person"."otp_uri", "person"."otp_activated_at", "person"."identity_id", "person"."email", "person"."name", "person"."disabled_at", "person"."passwordless_enabled", "identity"."roles"
	         FROM "tenant"."person"
		              INNER JOIN "tenant"."identity" AS "identity" ON "identity"."id" = "person"."identity_id"
	         WHERE "person"."identity_id" IN (${args.identityIds.map(() => '?').join(', ')})`,
	parameters: [...args.identityIds],
	response: {
		rows: args.response.map(it => ({
			id: it.personId,
			password_hash: it.password ? `BCRYPTED-${it.password}` : null,
			identity_id: it.identityId,
			roles: it.roles ?? [],
			email: it.email,
		})),
	},
})
