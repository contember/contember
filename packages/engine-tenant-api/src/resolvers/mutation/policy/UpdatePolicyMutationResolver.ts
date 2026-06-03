import { MutationResolvers, MutationUpdatePolicyArgs, UpdatePolicyResponse } from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions, PolicyBoundaryError, PolicyNotFoundError, PolicyService, PolicyValidationError } from '../../../model/index.js'
import { createErrorResponse } from '../../errorUtils.js'
import { policyDocumentFromInput, PolicyResponseFactory } from '../../responseHelpers/PolicyResponseFactory.js'

export class UpdatePolicyMutationResolver implements MutationResolvers {
	constructor(private readonly policyService: PolicyService) {}

	async updatePolicy(
		_: unknown,
		{ slug, input }: MutationUpdatePolicyArgs,
		context: TenantResolverContext,
	): Promise<UpdatePolicyResponse> {
		await context.requireAccess({
			action: PermissionActions.POLICY_UPDATE,
			message: 'You are not allowed to update a policy',
		})
		try {
			await this.policyService.update(context.db, context.identity, slug, {
				label: input.label ?? undefined,
				description: input.description,
				document: input.document ? policyDocumentFromInput(input.document) : undefined,
			})
			const updated = await this.policyService.getBySlug(context.db, slug)
			if (!updated) {
				return createErrorResponse('POLICY_NOT_FOUND', `Policy ${slug} not found`)
			}
			return {
				ok: true,
				result: { policy: PolicyResponseFactory.toGraphQL(updated) },
			}
		} catch (e) {
			if (e instanceof PolicyBoundaryError) {
				return createErrorResponse('EXCEEDS_PERMISSIONS', e.message)
			}
			if (e instanceof PolicyNotFoundError) {
				return createErrorResponse('POLICY_NOT_FOUND', e.message)
			}
			if (e instanceof PolicyValidationError) {
				return createErrorResponse('INVALID_DOCUMENT', e.message)
			}
			throw e
		}
	}
}
