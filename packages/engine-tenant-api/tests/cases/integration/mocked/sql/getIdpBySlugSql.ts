import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'
import { IdentityProviderRow } from '../../../../../src/model/queries/idp/types'

export const getIdpBySlugSql = (args: {
	slug: string
	response: null | IdentityProviderRow
}): ExpectedQuery => ({
	sql: SQL`select "id", "slug", "type", "configuration", "disabled_at" as "disabledAt", "auto_sign_up" as "autoSignUp", "exclusive"
		from "tenant"."identity_provider"
		where "slug" = ?`,
	parameters: [args.slug],
	response: {
		rows: args.response
			? [args.response]
			: [],
	},
})
