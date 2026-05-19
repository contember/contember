import { AccessNode, AuthorizationScope, Authorizator } from '@contember/authorization'
import { ForbiddenError } from '@contember/graphql-utils'
import { EvaluationContext, PolicyEngine, PolicySource } from '@contember/policy'
import { ProjectScopeFactory } from './ProjectScopeFactory'
import { Project, ProjectSchemaResolver } from '../type'
import { Identity } from './Identity'
import { Acl } from '@contember/schema'
import { buildMembershipSubject, ProjectSchemaPolicyProvider } from '../policy/ProjectSchemaPolicyProvider'

export type AccessVerifier = (action: Authorizator.Action) => Promise<boolean>

const deniedScope = new AuthorizationScope.Fixed(AccessNode.Fixed.denied())

export class PermissionContext {
	private projectScopes: Record<string, AuthorizationScope<Identity>> = {}

	constructor(
		public readonly identity: Identity,
		public readonly authorizator: Authorizator<Identity>,
		private readonly projectScopeFactory: ProjectScopeFactory,
		private readonly schemaResolver: ProjectSchemaResolver,
		private readonly policySources: readonly PolicySource[] = [],
	) {}

	public async isAllowed<Meta extends {} | undefined>({
		scope,
		action,
	}: {
		scope?: AuthorizationScope<Identity>
		action: Authorizator.Action<Meta>
	}): Promise<boolean> {
		return await this.authorizator.isAllowed(this.identity, scope || new AuthorizationScope.Global(), action)
	}

	public createAccessVerifier(scope: AuthorizationScope<Identity>): AccessVerifier {
		return action => this.isAllowed({ scope, action })
	}

	public async requireAccess<Meta extends {} | undefined>({
		scope,
		action,
		message,
	}: {
		scope?: AuthorizationScope<Identity>
		action: Authorizator.Action<Meta>
		message?: string
	}): Promise<void> {
		if (!(await this.isAllowed({ scope, action }))) {
			throw new ForbiddenError(message || 'Forbidden')
		}
	}

	public async createProjectScope(project: Pick<Project, 'slug'> | null): Promise<AuthorizationScope<Identity>> {
		if (!project) {
			return deniedScope
		}
		if (!this.projectScopes[project.slug]) {
			this.projectScopes[project.slug] = (await this.projectScopeFactory.create(this.schemaResolver, project)) || deniedScope
		}
		return this.projectScopes[project.slug]
	}

	/**
	 * Evaluate a policy-engine action against the configured policy sources.
	 *
	 * Coexists with the legacy `requireAccess`/Authorizator path. Resolvers can
	 * adopt this incrementally — typically by first checking the policy engine,
	 * then falling back to the legacy check during migration.
	 *
	 * `extraSources` is appended to the base sources for this single call —
	 * pass the result of `withProjectPolicy(...)` to layer in project-schema
	 * permissions when the action targets a specific project.
	 *
	 * Missing-context safety: condition operators returning `'missing'` are
	 * resolved per statement effect — `allow` skips the statement, `deny` fires
	 * fail-closed. Built-in role-escalation guards therefore apply even if the
	 * caller forgets a `subject.*` field. See `@contember/policy` engine docs.
	 */
	public async isAllowedAction(
		action: string,
		resource: string,
		context?: EvaluationContext,
		extraSources: readonly PolicySource[] = [],
	): Promise<boolean> {
		const engine = new PolicyEngine([...this.policySources, ...extraSources])
		return engine.isAllowed(action, resource, this.buildContext(context))
	}

	public async requireAction(
		action: string,
		resource: string,
		context?: EvaluationContext,
		extraSources: readonly PolicySource[] = [],
		message?: string,
	): Promise<void> {
		if (!(await this.isAllowedAction(action, resource, context, extraSources))) {
			throw new ForbiddenError(message || `Forbidden: ${action} on ${resource}`)
		}
	}

	/**
	 * Build the per-project schema policy source plus the canonical resource
	 * string. Returns `projectProvider: null` when the project has no schema
	 * (so callers can short-circuit). Pass `projectProvider` (wrapped in an
	 * array) as `extraSources` to `isAllowedAction` / `requireAction`.
	 *
	 * `buildSubject` translates an `Acl.Membership` into the shape the engine
	 * expects under `subject.membership`. Callers MUST use it (rather than
	 * passing the raw membership) — the raw array form would cause
	 * `subject.membership.variables.X` to read `undefined`, making the
	 * variable-subset check vacuously true and broadening permissions.
	 */
	public async withProjectPolicy(project: Pick<Project, 'slug'>): Promise<{
		projectProvider: PolicySource | null
		projectResource: string
		buildSubject: (membership: Acl.Membership) => { role: string; variables: Record<string, readonly string[]> }
	}> {
		const projectResource = `project:${project.slug}`
		const schema = await this.schemaResolver.getSchema(project.slug)
		if (!schema) {
			return { projectProvider: null, projectResource, buildSubject: buildMembershipSubject }
		}
		const memberships = await this.identity.getProjectMemberships(project.slug)
		const provider = new ProjectSchemaPolicyProvider({
			slug: project.slug,
			acl: schema.acl,
			memberships,
		})
		return { projectProvider: provider, projectResource, buildSubject: buildMembershipSubject }
	}

	private buildContext(context?: EvaluationContext): EvaluationContext {
		// Caller context spread first so it cannot override server-supplied
		// identity. Callers wanting to add identity-adjacent fields must put
		// them under their own namespace (e.g. `subject`).
		return {
			...context,
			identity: {
				id: this.identity.id,
				roles: this.identity.roles,
			},
		}
	}
}
