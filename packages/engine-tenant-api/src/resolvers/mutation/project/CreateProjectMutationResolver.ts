import {
	CreateProjectResponse,
	CreateProjectResponseErrorCode,
	MutationCreateProjectArgs,
	MutationResolvers,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectManager } from '../../../model'
import { createErrorResponse } from '../../errorUtils'

export class CreateProjectMutationResolver implements MutationResolvers {
	constructor(private readonly projectManager: ProjectManager) {}

	async createProject(
		parent: any,
		args: MutationCreateProjectArgs,
		context: ResolverContext,
	): Promise<CreateProjectResponse> {
		const project = await this.projectManager.getProjectBySlug(context.db, args.projectSlug)
		if (
			project &&
			(await context.isAllowed({
				scope: await context.permissionContext.createProjectScope(project),
				action: PermissionActions.PROJECT_VIEW,
			}))
		) {
			return createErrorResponse(CreateProjectResponseErrorCode.AlreadyExists, `Project ${args.projectSlug} already exists`)
		}
		await context.requireAccess({
			action: PermissionActions.PROJECT_CREATE,
			message: 'You are not allowed to create a project',
		})
		const response = await this.projectManager.createProject(
			context.projectGroup,
			{
				slug: args.projectSlug,
				name: args.name || args.projectSlug,
				config: args.config || {},
				secrets: Object.fromEntries((args.secrets || []).map(it => [it.key, it.value])),
			},
			context.identity.id,
		)
		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}
		return {
			ok: true,
			error: null,
			result: {
				deployerApiKey: response.result.deployerApiKey.toApiKeyWithToken(),
			},
		}
	}
}
