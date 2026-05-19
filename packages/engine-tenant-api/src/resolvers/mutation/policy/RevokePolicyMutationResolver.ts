import { MutationResolvers, MutationRevokePolicyArgs, RevokePolicyResponse } from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PermissionActions, PolicyService } from '../../../model'
import { createErrorResponse } from '../../errorUtils'

export class RevokePolicyMutationResolver implements MutationResolvers {
	constructor(private readonly policyService: PolicyService) {}

	async revokePolicy(
		_: unknown,
		{ identityId, policySlug }: MutationRevokePolicyArgs,
		context: TenantResolverContext,
	): Promise<RevokePolicyResponse> {
		await context.requireAccess({
			action: PermissionActions.POLICY_REVOKE,
			message: 'You are not allowed to revoke a policy',
		})
		const policy = await this.policyService.getBySlug(context.db, policySlug)
		if (!policy) {
			return createErrorResponse('POLICY_NOT_FOUND', `Policy ${policySlug} not found`)
		}
		const { revoked } = await this.policyService.revoke(context.db, identityId, policySlug)
		if (!revoked) {
			return createErrorResponse('NOT_ASSIGNED', `Policy ${policySlug} is not assigned to identity ${identityId}`)
		}
		return { ok: true }
	}
}
