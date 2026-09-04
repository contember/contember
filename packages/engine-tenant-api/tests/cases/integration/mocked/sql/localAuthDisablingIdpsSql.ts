import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

/**
 * The `LocalAuthDisablingIdpsQuery` lookup every local authentication path runs.
 * `slugs` defaults to none, i.e. local authentication stays available.
 */
export const localAuthDisablingIdpsSql = (args: {
	personId: string
	slugs?: string[]
}): ExpectedQuery => ({
	sql: SQL`SELECT "identity_provider"."slug" AS "slug"
	         FROM "tenant"."person_identity_provider"
		              INNER JOIN "tenant"."identity_provider" AS "identity_provider" ON "identity_provider"."id" = "person_identity_provider"."identity_provider_id"
	         WHERE "person_identity_provider"."person_id" = ? AND "identity_provider"."disable_local_authentication" = ? AND "identity_provider"."disabled_at" IS NULL
	         ORDER BY "identity_provider"."slug" ASC`,
	parameters: [args.personId, true],
	response: {
		rows: (args.slugs ?? []).map(slug => ({ slug })),
	},
})
