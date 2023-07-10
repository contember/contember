import { SQL } from '../../../../src/tags'
import { ExpectedQuery } from '@contember/database-tester'
import { ApiKey } from '../../../../../src'

export const getApiKeySql = (args: {
	apiKeyId: string
	response: { identityId: string; personId: string; apiKeyType: ApiKey.Type }
}): ExpectedQuery => ({
	sql: SQL
	`select "api_key"."id", "api_key"."type", "api_key"."identity_id", "api_key"."disabled_at", "api_key"."expires_at", "identity"."roles", "api_key"."expiration", "person"."id" as "person_id"
		from "tenant"."api_key"
    	inner join "tenant"."identity" as "identity" on "api_key"."identity_id" = "identity"."id"
    	left join "tenant"."person" as "person" on "person"."identity_id" = "identity"."id"
		where "api_key"."id" = ?
	`,
	parameters: [args.apiKeyId],
	response: {
		rows: args.response
			? [
				{
					id: args.apiKeyId,
					type: args.response.apiKeyType,
					identity_id: args.response.identityId,
					disabled_at: null,
					expires_at: null,
					expiration: null,
					roles: [],
					person_id: args.response.personId,
				},
			]
			: [],
	},
})
