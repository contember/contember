import { MutationResolvers, MutationUpdateProjectArgs, UpdateProjectResponse } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions, ProjectManager } from '../../../model/index.js'
import { createProjectNotFoundResponse } from '../../errorUtils.js'
import { Merger } from '@contember/config-loader'
import { ResponseOk } from '../../../model/utils/Response.js'

export class UpdateProjectMutationResolver implements MutationResolvers {
	constructor(private readonly projectManager: ProjectManager) {}

	async updateProject(
		parent: any,
		args: MutationUpdateProjectArgs,
		context: TenantResolverContext,
	): Promise<UpdateProjectResponse> {
		const project = await this.projectManager.getProjectBySlug(context.db, args.projectSlug)
		await context.requireAccess({
			scope: await context.permissionContext.createProjectScope(project),
			action: PermissionActions.PROJECT_UPDATE,
			message: 'You are not allowed to update a project',
		})
		if (!project) {
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', args.projectSlug)
		}
		const nameChange = args.name && args.name !== project.name ? { before: project.name, after: args.name } : undefined
		const configChanged = args.config !== undefined
		await this.projectManager.updateProject(context.db, project.id, {
			name: args.name || undefined,
			config: args.config !== undefined ? Merger.merge(args.mergeConfig ? project.config : {}, args.config as any) : undefined,
		})

		await context.logAuthAction({
			type: 'project_update',
			response: new ResponseOk(null),
			eventData: {
				slug: project.slug,
				...(nameChange ? { name: nameChange } : {}),
				...(configChanged ? { configChanged: true, mergeConfig: args.mergeConfig ?? false } : {}),
			},
		})

		return { ok: true }
	}
}
