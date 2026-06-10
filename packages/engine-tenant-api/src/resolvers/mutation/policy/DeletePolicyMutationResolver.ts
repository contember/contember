import { DeletePolicyResponse, MutationDeletePolicyArgs, MutationResolvers } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions, PolicyBoundaryError, PolicyService } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'

export class DeletePolicyMutationResolver implements MutationResolvers {
	constructor(private readonly policyService: PolicyService) {}

	async deletePolicy(
		_: unknown,
		{ slug }: MutationDeletePolicyArgs,
		context: TenantResolverContext,
	): Promise<DeletePolicyResponse> {
		await context.requireAccess({
			action: PermissionActions.POLICY_DELETE,
			message: 'You are not allowed to delete a policy',
		})
		try {
			const result = await this.policyService.delete(context.db, context.identity, slug)
			if (!result.deleted) {
				return createErrorResponse('POLICY_NOT_FOUND', `Policy ${slug} not found`)
			}
			return { ok: true }
		} catch (e) {
			if (e instanceof PolicyBoundaryError) {
				return createErrorResponse('EXCEEDS_PERMISSIONS', e.message)
			}
			throw e
		}
	}
}
