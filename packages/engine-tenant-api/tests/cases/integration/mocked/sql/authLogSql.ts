import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags'
import { JSONValue } from '@contember/schema'

export interface AuthLogRow {
	id: string
	created_at: Date
	type: string
	success: boolean
	invoked_by_id: string | null
	person_id: string | null
	target_person_id: string | null
	person_input_identifier: string | null
	error_code: string | null
	error_message: string | null
	ip_address: string | null
	user_agent: string | null
	identity_provider_id: string | null
	metadata: JSONValue | null
	event_data: JSONValue | null
}

export const authLogPlainSql = (args: {
	limit: number
	offset: number
	rows: AuthLogRow[]
}): ExpectedQuery => ({
	sql: SQL`select "person_auth_log"."id",
			       "person_auth_log"."created_at",
			       "person_auth_log"."type",
			       "person_auth_log"."success",
			       "person_auth_log"."invoked_by_id",
			       "person_auth_log"."person_id",
			       "person_auth_log"."target_person_id",
			       "person_auth_log"."person_input_identifier",
			       "person_auth_log"."error_code",
			       "person_auth_log"."error_message",
			       "person_auth_log"."ip_address",
			       "person_auth_log"."user_agent",
			       "person_auth_log"."identity_provider_id",
			       "person_auth_log"."metadata",
			       "person_auth_log"."event_data"
			from "tenant"."person_auth_log"
			order by "person_auth_log"."created_at" desc, "person_auth_log"."id" desc
			limit ${String(args.limit + 1)} offset ${String(args.offset)}`,
	parameters: [],
	response: { rows: args.rows },
})

export const authLogFilteredSql = (args: {
	types: string[]
	targetPersonId: string
	limit: number
	offset: number
	rows: AuthLogRow[]
}): ExpectedQuery => ({
	sql: SQL`select "person_auth_log"."id",
			       "person_auth_log"."created_at",
			       "person_auth_log"."type",
			       "person_auth_log"."success",
			       "person_auth_log"."invoked_by_id",
			       "person_auth_log"."person_id",
			       "person_auth_log"."target_person_id",
			       "person_auth_log"."person_input_identifier",
			       "person_auth_log"."error_code",
			       "person_auth_log"."error_message",
			       "person_auth_log"."ip_address",
			       "person_auth_log"."user_agent",
			       "person_auth_log"."identity_provider_id",
			       "person_auth_log"."metadata",
			       "person_auth_log"."event_data"
			from "tenant"."person_auth_log"
			where "person_auth_log"."type" in (?, ?) and "person_auth_log"."target_person_id" = ?
			order by "person_auth_log"."created_at" desc, "person_auth_log"."id" desc
			limit ${String(args.limit + 1)} offset ${String(args.offset)}`,
	parameters: [...args.types, args.targetPersonId],
	response: { rows: args.rows },
})
