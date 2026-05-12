import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'

export interface SessionRow {
	id: string
	created_at: Date
	expires_at: Date | null
	last_used_at: Date | null
	last_ip: string | null
	last_user_agent: string | null
	created_ip: string | null
	created_user_agent: string | null
}

export const listSessionsSql = (args: {
	identityId: string
	now: Date
	rows: SessionRow[]
}): ExpectedQuery => ({
	sql: SQL`select "api_key"."id",
			       "api_key"."created_at",
			       "api_key"."expires_at",
			       "api_key"."last_used_at",
			       "api_key"."last_ip",
			       "api_key"."last_user_agent",
			       "api_key"."created_ip",
			       "api_key"."created_user_agent"
			from "tenant"."api_key"
			where "api_key"."identity_id" = ?
			  and "api_key"."type" = ?
			  and "api_key"."disabled_at" is null
			  and ("api_key"."expires_at" is null or "api_key"."expires_at" > ?)
			order by "api_key"."created_at" desc`,
	parameters: [args.identityId, 'session', args.now],
	response: { rows: args.rows },
})
