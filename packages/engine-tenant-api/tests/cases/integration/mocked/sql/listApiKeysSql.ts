import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'

export interface ApiKeyListResponseRow {
	id: string
	identityId: string
	description?: string | null
	disabledAt?: Date | null
	createdAt: Date
	lastUsedAt?: Date | null
	expiresAt?: Date | null
}

const baseSelect =
	`select "api_key"."id", "api_key"."type", "api_key"."disabled_at", "api_key"."created_at", "api_key"."last_used_at", "api_key"."expires_at", "api_key"."identity_id", "identity"."description"
	 from "tenant"."api_key"
	 inner join "tenant"."identity" as "identity" on "api_key"."identity_id" = "identity"."id"`

const mapRows = (rows: ApiKeyListResponseRow[]) =>
	rows.map(row => ({
		id: row.id,
		type: 'permanent',
		disabled_at: row.disabledAt ?? null,
		created_at: row.createdAt,
		last_used_at: row.lastUsedAt ?? null,
		expires_at: row.expiresAt ?? null,
		identity_id: row.identityId,
		description: row.description ?? null,
	}))

export const projectApiKeysSql = (args: { projectId: string; rows: ApiKeyListResponseRow[] }): ExpectedQuery => ({
	sql: SQL`${baseSelect}
		where "api_key"."type" = ? and exists (select ?::int from "tenant"."project_membership" where "project_membership"."identity_id" = "api_key"."identity_id" and "project_id" = ?)
		order by "api_key"."created_at" desc`,
	parameters: ['permanent', 1, args.projectId],
	response: { rows: mapRows(args.rows) },
})

export const globalApiKeysSql = (args: { rows: ApiKeyListResponseRow[] }): ExpectedQuery => ({
	sql: SQL`${baseSelect}
		where "api_key"."type" = ? and not(exists (select ?::int from "tenant"."project_membership" where "project_membership"."identity_id" = "api_key"."identity_id"))
		order by "api_key"."created_at" desc`,
	parameters: ['permanent', 1],
	response: { rows: mapRows(args.rows) },
})
