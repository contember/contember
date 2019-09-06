import {
	CreateApiKeyErrorCode,
	CreateApiKeyResponse,
	MutationCreateApiKeyArgs,
	MutationResolvers,
} from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../../ResolverContext'
import { ApiKeyManager, PermissionActions, ProjectManager, ProjectScope } from '../../../'
import { AuthorizationScope } from '@contember/authorization'

export class CreateApiKeyMutationResolver implements MutationResolvers {
	constructor(private readonly apiKeyManager: ApiKeyManager, private readonly projectManager: ProjectManager) {}

	async createApiKey(
		parent: any,
		{ projects, roles }: MutationCreateApiKeyArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<CreateApiKeyResponse> {
		const projectsRows = await Promise.all(
			(projects || []).map(async it => await this.projectManager.getProjectBySlug(it.projectSlug)),
		)

		if (roles || !projects) {
			await context.requireAccess({
				action: PermissionActions.API_KEY_CREATE,
				message: 'You are not allowed to create api key',
			})
		} else {
			const scopes = projectsRows.map(it => new ProjectScope(it))
			const scope = new AuthorizationScope.Intersection(scopes)
			await context.requireAccess({
				scope,
				action: PermissionActions.API_KEY_CREATE,
				message: 'You are not allowed to create api key',
			})
		}

		if ((projects || []).find(it => !projectsRows.find(row => row && row.slug === it.projectSlug))) {
			return {
				ok: false,
				errors: [{ code: CreateApiKeyErrorCode.ProjectNotFound }],
			}
		}

		const result = await this.apiKeyManager.createPermanentApiKey(
			[...(roles || [])],
			(projects || []).map(it => ({
				id: projectsRows.find(row => row && row.slug)!.id,
				memberships: it.memberships,
			})),
		)

		if (!result.ok) {
			return {
				ok: false,
				errors: result.errors.map(errorCode => ({ code: errorCode })),
			}
		}

		return {
			ok: true,
			errors: [],
			result: {
				apiKey: {
					id: result.result.apiKey.id,
					token: result.result.apiKey.token,
					identity: {
						id: result.result.identityId,
						projects: [],
					},
				},
			},
		}
	}
}
