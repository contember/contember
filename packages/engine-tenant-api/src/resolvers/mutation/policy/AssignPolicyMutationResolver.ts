import { AssignPolicyResponse, MutationAssignPolicyArgs, MutationResolvers } from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { IdentityQuery, PermissionActions, PolicyBoundaryError, PolicyNotFoundError, PolicyService, PolicyValidationError } from '../../../model'
import { createErrorResponse } from '../../errorUtils'

export class AssignPolicyMutationResolver implements MutationResolvers {
	constructor(private readonly policyService: PolicyService) {}

	async assignPolicy(
		_: unknown,
		{ identityId, policySlug, tags }: MutationAssignPolicyArgs,
		context: TenantResolverContext,
	): Promise<AssignPolicyResponse> {
		await context.requireAccess({
			action: PermissionActions.POLICY_ASSIGN,
			message: 'You are not allowed to assign a policy',
		})
		const identities = await context.db.queryHandler.fetch(new IdentityQuery([identityId]))
		if (identities.length === 0) {
			return createErrorResponse('IDENTITY_NOT_FOUND', `Identity ${identityId} not found`)
		}
		try {
			await this.policyService.assign(
				context.db,
				context.identity,
				identityId,
				policySlug,
				(tags ?? {}) as Record<string, unknown>,
			)
			return { ok: true }
		} catch (e) {
			if (e instanceof PolicyBoundaryError) {
				return createErrorResponse('EXCEEDS_PERMISSIONS', e.message)
			}
			if (e instanceof PolicyNotFoundError) {
				return createErrorResponse('POLICY_NOT_FOUND', e.message)
			}
			if (e instanceof PolicyValidationError) {
				return createErrorResponse('INVALID_TAGS', e.message)
			}
			throw e
		}
	}
}
