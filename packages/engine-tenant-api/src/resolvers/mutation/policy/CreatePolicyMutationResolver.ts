import { CreatePolicyResponse, MutationCreatePolicyArgs, MutationResolvers } from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { PermissionActions, PolicyService, PolicyValidationError } from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { policyDocumentFromInput, PolicyResponseFactory } from '../../responseHelpers/PolicyResponseFactory'

export class CreatePolicyMutationResolver implements MutationResolvers {
	constructor(private readonly policyService: PolicyService) {}

	async createPolicy(
		_: unknown,
		{ input }: MutationCreatePolicyArgs,
		context: TenantResolverContext,
	): Promise<CreatePolicyResponse> {
		await context.requireAccess({
			action: PermissionActions.POLICY_CREATE,
			message: 'You are not allowed to create a policy',
		})
		const existing = await this.policyService.getBySlug(context.db, input.slug)
		if (existing) {
			return createErrorResponse('SLUG_ALREADY_EXISTS', `Policy with slug "${input.slug}" already exists`)
		}
		try {
			const { id } = await this.policyService.create(context.db, {
				slug: input.slug,
				label: input.label ?? undefined,
				description: input.description ?? undefined,
				document: policyDocumentFromInput(input.document),
			})
			const created = await this.policyService.getBySlug(context.db, input.slug)
			if (!created) {
				throw new Error(`Policy ${id} disappeared after creation`)
			}
			return {
				ok: true,
				result: { policy: PolicyResponseFactory.toGraphQL(created) },
			}
		} catch (e) {
			if (e instanceof PolicyValidationError) {
				const code = e.message.startsWith('Invalid policy slug') || e.message.includes('reserved')
					? (e.message.includes('reserved') ? 'SLUG_RESERVED' : 'INVALID_SLUG')
					: 'INVALID_DOCUMENT'
				return createErrorResponse(code, e.message)
			}
			throw e
		}
	}
}
