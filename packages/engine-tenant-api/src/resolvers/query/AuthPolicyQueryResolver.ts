import { AuthPolicy, QueryResolvers } from '../../schema'
import { AuthPolicyManager, PermissionActions } from '../../model'
import { TenantResolverContext } from '../TenantResolverContext'
import { ProjectsQuery } from '../../model/queries'

/**
 * Lists configured auth policies. Gated like `configure`. Maps each row's
 * `project_id` back to a project slug, and lets the Interval scalar serialize
 * the IPostgresInterval session fields.
 */
export class AuthPolicyQueryResolver implements Pick<QueryResolvers, 'authPolicies'> {
	constructor(
		private readonly authPolicyManager: AuthPolicyManager,
	) {}

	async authPolicies(parent: unknown, args: unknown, context: TenantResolverContext): Promise<readonly AuthPolicy[]> {
		await context.requireAccess({
			action: PermissionActions.CONFIGURE,
			message: 'You are not allowed to view auth policies',
		})

		const [rows, projects] = await Promise.all([
			this.authPolicyManager.listPolicies(context.db),
			context.db.queryHandler.fetch(new ProjectsQuery()),
		])
		const slugById = new Map(projects.map(p => [p.id, p.slug]))

		return rows.map((row): AuthPolicy => ({
			id: row.id,
			scope: row.scope,
			project: row.project_id !== null ? slugById.get(row.project_id) ?? null : null,
			roles: row.roles,
			mfaRequired: row.mfa_required,
			// IPostgresInterval; the Interval scalar serializes it to an ISO 8601 string.
			tokenExpiration: row.token_expiration as unknown as AuthPolicy['tokenExpiration'],
			idleTimeout: row.idle_timeout as unknown as AuthPolicy['idleTimeout'],
			mfaGraceDuration: row.grace_duration as unknown as AuthPolicy['mfaGraceDuration'],
			rememberMeAllowed: row.remember_me_allowed,
		}))
	}
}
