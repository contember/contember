import { Authorizator } from '@contember/authorization'
import { ForbiddenError } from '@contember/graphql-utils'
import { EvaluationContext, PolicyEngine, PolicySource } from '@contember/policy'
import { Acl, ProjectRole } from '@contember/schema'
import { Project, ProjectSchemaResolver } from '../type/index.js'
import { Identity } from './Identity.js'
import { TenantRole } from './Roles.js'
import { translateAction } from './actionMapping.js'
import { DatabaseContext } from '../utils/index.js'
import { TenantDbPolicyProvider } from '../policy/TenantDbPolicyProvider.js'
import { buildMembershipSubject, ProjectSchemaPolicyProvider } from '../policy/ProjectSchemaPolicyProvider.js'

export type AccessVerifier = (action: Authorizator.Action) => Promise<boolean>

/**
 * Pre-resolved authorization target for one scope key. Holds the canonical
 * engine `resource` plus a ready `PolicyEngine` whose `TenantDbPolicyProvider`
 * was built with the scope's effective roles (incl. project-aware synthesis).
 */
interface ScopeResolution {
	resource: string
	engine: PolicyEngine
}

/**
 * The single authorization surface for the tenant API. Resolvers call
 * `isAllowed` / `requireAccess` with a typed `PermissionActions` action and an
 * optional `project`; this evaluates it against the `@contember/policy` engine.
 *
 * Scope resolution (`resolve`) is the one place project-aware tenant roles are
 * synthesized: an identity that is a member (resp. admin) of the target project
 * gains `PROJECT_MEMBER` (resp. `PROJECT_ADMIN`) **only for that project's
 * resource**. Because built-in `PROJECT_ADMIN` statements use `resources:['*']`,
 * this synthesis MUST stay resource-local — it is never folded into the global
 * (project-less) evaluation, otherwise a project-admin-by-membership would gain
 * global admin powers.
 */
export class PermissionContext {
	private readonly resolutionCache: Map<string, Promise<ScopeResolution>> = new Map()

	constructor(
		public readonly identity: Identity,
		private readonly databaseContext: DatabaseContext,
		private readonly schemaResolver: ProjectSchemaResolver,
	) {}

	public async isAllowed<Meta extends {} | undefined>({
		project,
		action,
	}: {
		project?: Pick<Project, 'slug'> | null
		action: Authorizator.Action<Meta>
	}): Promise<boolean> {
		const { engine, resource } = await this.resolve(project)
		const translated = translateAction(action, this.identity)

		if (translated.subjectMemberships !== undefined) {
			if (translated.subjectMemberships.length === 0) {
				return engine.isAllowed(translated.engineAction, resource, translated.baseContext)
			}
			// Membership-aware actions: every targeted membership must be
			// individually allowed (AND-reduce), mirroring the legacy verifier.
			for (const membership of translated.subjectMemberships) {
				const ctx: EvaluationContext = {
					...translated.baseContext,
					subject: {
						...((translated.baseContext.subject as Record<string, unknown> | undefined) ?? {}),
						membership: buildMembershipSubject(membership),
					},
				}
				if (!(await engine.isAllowed(translated.engineAction, resource, ctx))) {
					return false
				}
			}
			return true
		}
		return engine.isAllowed(translated.engineAction, resource, translated.baseContext)
	}

	public createAccessVerifier(project?: Pick<Project, 'slug'> | null): AccessVerifier {
		return action => this.isAllowed({ project, action })
	}

	public async requireAccess<Meta extends {} | undefined>({
		project,
		action,
		message,
	}: {
		project?: Pick<Project, 'slug'> | null
		action: Authorizator.Action<Meta>
		message?: string
	}): Promise<void> {
		if (!(await this.isAllowed({ project, action }))) {
			throw new ForbiddenError(message || 'Forbidden')
		}
	}

	private resolve(project?: Pick<Project, 'slug'> | null): Promise<ScopeResolution> {
		const key = project === undefined || project === null ? 'global' : `project:${project.slug}`
		let cached = this.resolutionCache.get(key)
		if (!cached) {
			cached = this.doResolve(project)
			this.resolutionCache.set(key, cached)
		}
		return cached
	}

	private async doResolve(project?: Pick<Project, 'slug'> | null): Promise<ScopeResolution> {
		// A missing project (null) or one without a resolvable schema falls back to the
		// global scope: only the identity's own (project-less) roles are evaluated against
		// `*`, with no project-membership synthesis. This mirrors the legacy authorizator,
		// where both `Global` and `deniedScope` resolved to `AccessNode.Fixed.denied()` and
		// access was granted solely by the union with the identity's global roles — so a
		// super_admin still passes (and reaches e.g. PROJECT_NOT_FOUND), while an unprivileged
		// caller is denied regardless of whether the project exists.
		if (project === undefined || project === null) {
			return this.globalScope()
		}
		const schema = await this.schemaResolver.getSchema(project.slug)
		if (!schema) {
			return this.globalScope()
		}
		const memberships = await this.identity.getProjectMemberships(project.slug)
		const roles = [...this.identity.roles]
		if (memberships.length > 0) {
			roles.push(TenantRole.PROJECT_MEMBER)
		}
		if (memberships.some((it: Acl.Membership) => it.role === ProjectRole.ADMIN)) {
			roles.push(TenantRole.PROJECT_ADMIN)
		}
		const projectProvider = new ProjectSchemaPolicyProvider({
			slug: project.slug,
			acl: schema.acl,
			memberships,
		})
		return {
			resource: `project:${project.slug}`,
			engine: this.buildEngine(roles, projectProvider),
		}
	}

	private globalScope(): ScopeResolution {
		return { resource: '*', engine: this.buildEngine(this.identity.roles, null) }
	}

	private buildEngine(roles: readonly string[], projectProvider: PolicySource | null): PolicyEngine {
		const sources: PolicySource[] = [
			new TenantDbPolicyProvider(this.databaseContext, { id: this.identity.id, roles }),
		]
		if (projectProvider) {
			sources.push(projectProvider)
		}
		return new PolicyEngine(sources)
	}
}
