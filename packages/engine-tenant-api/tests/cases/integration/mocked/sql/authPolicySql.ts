import { ExpectedQuery } from '@contember/database-tester'
import { SQL } from '../../../../src/tags.js'
import PostgresInterval from 'postgres-interval'

export type AuthPolicyRowResponse = {
	id: string
	scope: 'global' | 'project'
	projectId?: string | null
	roles: string[]
	mfaRequired?: boolean | null
	tokenExpiration?: string | null
	idleTimeout?: string | null
	graceDuration?: string | null
	rememberMeAllowed?: boolean | null
}

/** `AuthPoliciesQuery` (list all). Defaults to an empty result (no policies configured). */
export const getAuthPoliciesSql = (rows: AuthPolicyRowResponse[] = []): ExpectedQuery => ({
	sql: SQL`select *  from "tenant"."auth_policy"`,
	parameters: [],
	response: {
		rows: rows.map(row => ({
			id: row.id,
			scope: row.scope,
			project_id: row.projectId ?? null,
			roles: row.roles,
			mfa_required: row.mfaRequired ?? null,
			token_expiration: row.tokenExpiration ? PostgresInterval(row.tokenExpiration) : null,
			idle_timeout: row.idleTimeout ? PostgresInterval(row.idleTimeout) : null,
			grace_duration: row.graceDuration ? PostgresInterval(row.graceDuration) : null,
			remember_me_allowed: row.rememberMeAllowed ?? null,
			created_at: new Date('2026-05-21T00:00:00.000Z'),
			updated_at: new Date('2026-05-21T00:00:00.000Z'),
		})),
	},
})

/** `AllProjectRolesByIdentityQuery` — every (project_id, role) the identity holds. */
export const getAllProjectRolesByIdentitySql = (args: {
	identityId: string
	rows?: { projectId: string; role: string }[]
}): ExpectedQuery => ({
	sql: SQL`select "project_id", "role" from "tenant"."project_membership" where "identity_id" = ?`,
	parameters: [args.identityId],
	response: {
		rows: (args.rows ?? []).map(r => ({ project_id: r.projectId, role: r.role })),
	},
})
