import { CreateProjectResponse, MutationCreateProjectArgs, MutationResolvers } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { isTokenHash, PermissionActions, ProjectManager, TenantRole } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { UserInputError } from '@contember/graphql-utils'
import { ResponseOk } from '../../../model/utils/Response.js'

export class CreateProjectMutationResolver implements MutationResolvers {
	constructor(private readonly projectManager: ProjectManager) {}

	async createProject(
		parent: any,
		{ projectSlug, name, config, deployTokenHash: deployTokenHashDeprecated, secrets, options }: MutationCreateProjectArgs,
		context: TenantResolverContext,
	): Promise<CreateProjectResponse> {
		const project = await this.projectManager.getProjectBySlug(context.db, projectSlug)

		if (project) {
			return createErrorResponse('ALREADY_EXISTS', `Project ${projectSlug} already exists`)
		}

		await context.requireAccess({
			action: PermissionActions.PROJECT_CREATE,
			message: 'You are not allowed to create a project',
		})
		const deployTokenHash = options?.deployTokenHash ?? deployTokenHashDeprecated ?? undefined

		if (typeof deployTokenHash === 'string' && !isTokenHash(deployTokenHash)) {
			throw new UserInputError('Invalid format of deployTokenHash. Must be hex-encoded sha256.')
		}

		const isSuperAdmin = await context.identity.roles.includes(TenantRole.SUPER_ADMIN)

		const response = await this.projectManager.createProject(
			context.db,
			context.logger,
			{
				slug: projectSlug,
				name: name || projectSlug,
				config: (config as any) || {},
				secrets: Object.fromEntries((secrets || []).map(it => [it.key, it.value])),
			},
			{
				ownerIdentityId: isSuperAdmin ? undefined : context.identity.id,
				deployTokenHash,
				noDeployToken: options?.noDeployToken ?? false,
			},
		)
		if (!response.ok) {
			return createErrorResponse(response.error, response.errorMessage)
		}

		await context.logAuthAction({
			type: 'project_create',
			response: new ResponseOk(null),
			eventData: {
				slug: projectSlug,
				name: name || projectSlug,
				secretKeys: (secrets ?? []).map(it => it.key).sort(),
			},
		})

		return {
			ok: true,
			error: null,
			result: {
				deployerApiKey: response.result.deployerApiKey?.toApiKeyWithToken(),
			},
		}
	}
}
