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

export class SetProjectSecretMutationResolver implements MutationResolvers {
	constructor(private readonly projectManager: ProjectManager, private readonly secretManager: SecretsManager) {}

	async setProjectSecret(
		parent: any,
		args: MutationSetProjectSecretArgs,
		context: TenantResolverContext,
	): Promise<SetProjectSecretResponse> {
		const project = await this.projectManager.getProjectBySlug(context.db, args.projectSlug)
		await context.requireAccess({
			scope: await context.permissionContext.createProjectScope(project),
			action: PermissionActions.PROJECT_SET_SECRET,
			message: 'You are not allowed to set project secrets',
		})
		if (!project) {
			return createProjectNotFoundResponse(AddProjectMemberErrorCode.ProjectNotFound, args.projectSlug)
		}
		await this.secretManager.setSecret(context.db, project.id, args.key, args.value)
		return { ok: true }
	}
}
