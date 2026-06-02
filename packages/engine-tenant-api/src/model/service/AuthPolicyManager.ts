import { DatabaseContext } from "../utils/index.js"
import { Response, ResponseError, ResponseOk } from "../utils/Response.js"
import { ProjectManager } from "./ProjectManager.js"
import { AuthPoliciesQuery } from "../queries/index.js"
import { CreateAuthPolicyCommand, DeleteAuthPolicyCommand, UpdateAuthPolicyCommand } from "../commands/index.js"
import { AuthPolicyRow, AuthPolicyScope } from "../type/index.js"
import { CreateAuthPolicyErrorCode, DeleteAuthPolicyErrorCode, UpdateAuthPolicyErrorCode } from "../../schema/index.js"

export type AuthPolicyInputValues = {
	scope: AuthPolicyScope
	/** Project slug; resolved to project_id. Required for scope='project', forbidden for scope='global'. */
	project?: string | null
	roles: string[]
	mfaRequired?: boolean | null
	tokenExpiration?: string | null
	idleTimeout?: string | null
	graceDuration?: string | null
	rememberMeAllowed?: boolean | null
}

/**
 * CRUD over the `auth_policy` table (shared infra reused by A19). Project is
 * always addressed by slug in the API and resolved to project_id here.
 */
export class AuthPolicyManager {
	constructor(
		private readonly projectManager: ProjectManager,
	) {}

	async listPolicies(db: DatabaseContext): Promise<AuthPolicyRow[]> {
		return db.queryHandler.fetch(new AuthPoliciesQuery())
	}

	async createPolicy(db: DatabaseContext, input: AuthPolicyInputValues): Promise<Response<{ id: string }, CreateAuthPolicyErrorCode>> {
		const projectResult = await this.resolveProjectId(db, input.scope, input.project ?? null)
		if (!projectResult.ok) {
			return new ResponseError(projectResult.error, projectResult.errorMessage)
		}
		const id = await db.commandBus.execute(
			new CreateAuthPolicyCommand({
				scope: input.scope,
				projectId: projectResult.projectId,
				roles: input.roles,
				mfaRequired: input.mfaRequired ?? null,
				tokenExpiration: input.tokenExpiration ?? null,
				idleTimeout: input.idleTimeout ?? null,
				graceDuration: input.graceDuration ?? null,
				rememberMeAllowed: input.rememberMeAllowed ?? null,
			}),
		)
		return new ResponseOk({ id })
	}

	async updatePolicy(db: DatabaseContext, id: string, input: AuthPolicyInputValues): Promise<Response<null, UpdateAuthPolicyErrorCode>> {
		const projectResult = await this.resolveProjectId(db, input.scope, input.project ?? null)
		if (!projectResult.ok) {
			return new ResponseError(projectResult.error, projectResult.errorMessage)
		}
		const updated = await db.commandBus.execute(
			new UpdateAuthPolicyCommand(id, {
				scope: input.scope,
				projectId: projectResult.projectId,
				roles: input.roles,
				mfaRequired: input.mfaRequired ?? null,
				tokenExpiration: input.tokenExpiration ?? null,
				idleTimeout: input.idleTimeout ?? null,
				graceDuration: input.graceDuration ?? null,
				rememberMeAllowed: input.rememberMeAllowed ?? null,
			}),
		)
		if (!updated) {
			return new ResponseError('NOT_FOUND', `Auth policy ${id} not found`)
		}
		return new ResponseOk(null)
	}

	async deletePolicy(db: DatabaseContext, id: string): Promise<Response<null, DeleteAuthPolicyErrorCode>> {
		const deleted = await db.commandBus.execute(new DeleteAuthPolicyCommand(id))
		if (!deleted) {
			return new ResponseError('NOT_FOUND', `Auth policy ${id} not found`)
		}
		return new ResponseOk(null)
	}

	/**
	 * Validates scope/project consistency and resolves a slug to project_id.
	 * `scope='project'` requires a project (which must exist); `scope='global'`
	 * forbids one.
	 */
	private async resolveProjectId(
		db: DatabaseContext,
		scope: AuthPolicyScope,
		projectSlug: string | null,
	): Promise<
		{ ok: true; projectId: string | null } | {
			ok: false
			error: 'PROJECT_REQUIRED' | 'PROJECT_NOT_ALLOWED' | 'PROJECT_NOT_FOUND'
			errorMessage: string
		}
	> {
		if (scope === 'global') {
			if (projectSlug !== null) {
				return { ok: false, error: 'PROJECT_NOT_ALLOWED', errorMessage: 'A global auth policy must not reference a project' }
			}
			return { ok: true, projectId: null }
		}
		// scope === 'project'
		if (projectSlug === null) {
			return { ok: false, error: 'PROJECT_REQUIRED', errorMessage: 'A project-scoped auth policy requires a project' }
		}
		const project = await this.projectManager.getProjectBySlug(db, projectSlug)
		if (!project) {
			return { ok: false, error: 'PROJECT_NOT_FOUND', errorMessage: `Project ${projectSlug} not found` }
		}
		return { ok: true, projectId: project.id }
	}
}
