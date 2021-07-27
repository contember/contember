import {
	CreateProjectResponse,
	CreateProjectResponseErrorCode,
	MutationCreateProjectArgs,
	MutationResolvers,
} from '../../../schema'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions, ProjectInitError, ProjectManager } from '../../../model'

export class CreateProjectMutationResolver implements MutationResolvers {
	constructor(private readonly projectManager: ProjectManager) {}

	async createProject(
		parent: any,
		args: MutationCreateProjectArgs,
		context: ResolverContext,
	): Promise<CreateProjectResponse> {
		await context.requireAccess({
			action: PermissionActions.PROJECT_CREATE,
			message: 'You are not allowed to create a project',
		})
		try {
			const response = await this.projectManager.createProject({
				slug: args.projectSlug,
				name: args.name || args.projectSlug,
				config: args.config || {},
				secrets: Object.fromEntries((args.secrets || []).map(it => [it.key, it.value])),
			})
			if (response) {
				return { ok: true }
			}
			return {
				ok: false,
				error: {
					code: CreateProjectResponseErrorCode.AlreadyExists,
					developerMessage: `Project ${args.projectSlug} already exists`,
				},
			}
		} catch (e) {
			if (e instanceof ProjectInitError) {
				return {
					ok: false,
					error: {
						code: CreateProjectResponseErrorCode.InitError,
						developerMessage: e.message,
					},
				}
			}
			throw e
		}
	}
}
