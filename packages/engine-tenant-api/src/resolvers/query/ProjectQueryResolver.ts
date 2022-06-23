import { Maybe, Project, QueryProjectBySlugArgs, QueryResolvers } from '../../schema/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'
import { PermissionActions, ProjectManager } from '../../model/index.js'

export class ProjectQueryResolver implements QueryResolvers {
	constructor(private readonly projectManager: ProjectManager) {}

	async projects(parent: unknown, args: unknown, context: TenantResolverContext): Promise<readonly Project[]> {
		return (await this.projectManager.getProjectsByIdentity(context.db, context.identity.id, context.permissionContext)).map(
			it => ({ ...it, members: [], roles: [] }),
		)
	}

	async projectBySlug(
		parent: unknown,
		args: QueryProjectBySlugArgs,
		context: TenantResolverContext,
	): Promise<Maybe<Project>> {
		const project = await this.projectManager.getProjectBySlug(context.db, args.slug)
		if (
			!project ||
			!(await context.isAllowed({
				scope: await context.permissionContext.createProjectScope(project),
				action: PermissionActions.PROJECT_VIEW,
			}))
		) {
			return null
		}

		return { ...project, members: [], roles: [] }
	}
}
