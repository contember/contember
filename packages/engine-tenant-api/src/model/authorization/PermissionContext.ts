import { AccessNode, AuthorizationScope, Authorizator } from '@contember/authorization'
import { ForbiddenError } from '@contember/graphql-utils'
import { ProjectScopeFactory } from './ProjectScopeFactory'
import { Project, ProjectSchemaResolver } from '../type'
import { Identity } from './Identity'

export type AccessVerifier = (action: Authorizator.Action) => Promise<boolean>

const deniedScope = new AuthorizationScope.Fixed(AccessNode.Fixed.denied())

export class PermissionContext {
	private projectScopes: Record<string, AuthorizationScope<Identity>> = {}

	constructor(
		public readonly identity: Identity,
		public readonly authorizator: Authorizator<Identity>,
		private readonly projectScopeFactory: ProjectScopeFactory,
		private readonly schemaResolver: ProjectSchemaResolver,
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

	public async requireAccess<Meta>({
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
}
