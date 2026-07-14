import { SQL } from '../../../../src/tags.js'
import { ExpectedQuery } from '@contember/database-tester'
import { ApiKey } from '../../../../../src/index.js'

export const getApiKeySql = (args: {
	apiKeyId: string
	response: { identityId: string; personId: string; apiKeyType: ApiKey.Type; trustForwardedInfo?: boolean }
}): ExpectedQuery => ({
	sql:
		SQL`select "api_key"."id", "api_key"."type", "api_key"."identity_id", "api_key"."disabled_at", "api_key"."expires_at", "identity"."roles", "api_key"."expiration", "person"."id" as "person_id", "api_key"."last_ip", "api_key"."last_user_agent", "api_key"."last_used_at", "api_key"."trust_forwarded_info", "api_key"."issued_at", "api_key"."idle_timeout", "api_key"."max_expires_at", "api_key"."expires_at" is not null and "api_key"."expires_at" <= now() as "is_expired", "api_key"."max_expires_at" is not null and "api_key"."max_expires_at" <= now() as "is_max_expired", "api_key"."idle_timeout" is not null and "api_key"."last_used_at" is not null and "api_key"."last_used_at" < now() - "api_key"."idle_timeout" - make_interval(secs => ?) as "is_idle_expired"
		from "tenant"."api_key"
    	inner join "tenant"."identity" as "identity" on "api_key"."identity_id" = "identity"."id"
    	left join "tenant"."person" as "person" on "person"."identity_id" = "identity"."id"
		where "api_key"."id" = ?
	`,
	parameters: [60, args.apiKeyId],
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
					last_ip: null,
					last_user_agent: null,
					last_used_at: null,
					trust_forwarded_info: args.response.trustForwardedInfo ?? false,
					issued_at: null,
					idle_timeout: null,
					max_expires_at: null,
				},
			]
			: [],
	},
})
