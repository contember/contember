import {
	CreateProjectResponse,
	CreateProjectResponseErrorCode,
	MutationCreateProjectArgs,
	MutationResolvers,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectInitializer, ProjectManager } from '../../../model'

export class CreateProjectMutationResolver implements MutationResolvers {
	constructor(
		private readonly projectManager: ProjectManager,
		private readonly projectIntializer: ProjectInitializer,
	) {}

	async createProject(
		parent: any,
		args: MutationCreateProjectArgs,
		context: ResolverContext,
	): Promise<CreateProjectResponse> {
		await context.requireAccess({
			action: PermissionActions.PROJECT_CREATE,
			message: 'You are not allowed to create a project',
		})
		const response = await this.projectManager.createProject({
			slug: args.slug,
			name: args.name || args.slug,
			config: args.config || {},
			secrets: Object.fromEntries((args.secrets || []).map(it => [it.key, it.value])),
		})
		await this.projectIntializer(args.slug)
		if (response) {
			return { ok: true }
		}
		return {
			ok: false,
			error: {
				code: CreateProjectResponseErrorCode.AlreadyExists,
				developerMessage: `Project ${args.slug} already exists`,
			},
		}
	}
}
