import { BuiltinPolicy, QueryResolvers } from '../../schema'
import { TenantResolverContext } from '../TenantResolverContext'
import { BUILTIN_POLICIES, PermissionActions } from '../../model'
import { PolicyResponseFactory } from '../responseHelpers/PolicyResponseFactory'

export class BuiltinPolicyQueryResolver implements QueryResolvers {
	async builtinPolicies(_: unknown, __: unknown, context: TenantResolverContext): Promise<BuiltinPolicy[]> {
		await context.requireAccess({
			action: PermissionActions.POLICY_VIEW,
			message: 'You are not allowed to view policies',
		})
		return BUILTIN_POLICIES.map(PolicyResponseFactory.builtinToGraphQL)
	}
}
