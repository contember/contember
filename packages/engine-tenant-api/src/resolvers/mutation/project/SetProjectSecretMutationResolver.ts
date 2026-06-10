import {
	AddProjectMemberErrorCode,
	CreateProjectResponseErrorCode,
	MutationResolvers,
	MutationSetProjectSecretArgs,
	SetProjectSecretResponse,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions, ProjectManager, SecretsManager } from '../../../model/index.js'
import { createProjectNotFoundResponse } from '../../errorUtils.js'
import { ResponseOk } from '../../../model/utils/Response.js'

export class SetProjectSecretMutationResolver implements MutationResolvers {
	constructor(private readonly projectManager: ProjectManager, private readonly secretManager: SecretsManager) {}

	async setProjectSecret(
		parent: any,
		args: MutationSetProjectSecretArgs,
		context: TenantResolverContext,
	): Promise<SetProjectSecretResponse> {
		const project = await this.projectManager.getProjectBySlug(context.db, args.projectSlug)
		await context.requireAccess({
			project,
			action: PermissionActions.PROJECT_SET_SECRET,
			message: 'You are not allowed to set project secrets',
		})
		if (!project) {
			return createProjectNotFoundResponse('PROJECT_NOT_FOUND', args.projectSlug)
		}
		await this.secretManager.setSecret(context.db, project.id, args.key, args.value)

		await context.logAuthAction({
			type: 'project_secret_change',
			response: new ResponseOk(null),
			eventData: {
				slug: project.slug,
				key: args.key,
			},
		})

		return { ok: true }
	}
}
