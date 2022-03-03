import { MutationAddIdpArgs, MutationResolvers, AddIdpResponse } from '../../../schema'
import { GraphQLResolveInfo } from 'graphql'
import { ResolverContext } from '../../ResolverContext'
import { PermissionActions } from '../../../model'
import { IDPManager } from '../../../model/service/idp/IDPManager'
import { createErrorResponse } from '../../errorUtils'

export class AddIDPMutationResolver implements MutationResolvers {
	constructor(private readonly idpManager: IDPManager) {
	}

	async addIDP(
		parent: any,
		args: MutationAddIdpArgs,
		context: ResolverContext,
		info: GraphQLResolveInfo,
	): Promise<AddIdpResponse> {
		await context.requireAccess({
			action: PermissionActions.IDP_ADD,
			message: 'You are not allowed to add IDP',
		})
		const result = await this.idpManager.addIDP(context.db, {
			configuration: args.configuration,
			slug: args.identityProvider,
			type: args.type,
			options: {
				autoSignUp: args.options?.autoSignUp ?? false,
			},
		})
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		return { ok: true }
	}
}
