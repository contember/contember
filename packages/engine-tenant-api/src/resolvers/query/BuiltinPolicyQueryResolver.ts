import { BuiltinPolicy, QueryResolvers } from '../../schema/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'
import { BUILTIN_POLICIES, PermissionActions } from '../../model/index.js'
import { PolicyResponseFactory } from '../responseHelpers/PolicyResponseFactory.js'

export class BuiltinPolicyQueryResolver implements QueryResolvers {
	async builtinPolicies(_: unknown, __: unknown, context: TenantResolverContext): Promise<BuiltinPolicy[]> {
		await context.requireAccess({
			action: PermissionActions.POLICY_VIEW,
			message: 'You are not allowed to view policies',
		})
		return BUILTIN_POLICIES.map(PolicyResponseFactory.builtinToGraphQL)
	}
}
