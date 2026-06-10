import { Policy as GraphQLPolicy, QueryPolicyArgs, QueryResolvers } from '../../schema/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'
import { PermissionActions, PolicyService } from '../../model/index.js'
import { PolicyResponseFactory } from '../responseHelpers/PolicyResponseFactory.js'

export class PolicyQueryResolver implements QueryResolvers {
	constructor(private readonly policyService: PolicyService) {}

	async policies(_: unknown, __: unknown, context: TenantResolverContext): Promise<GraphQLPolicy[]> {
		await context.requireAccess({
			action: PermissionActions.POLICY_VIEW,
			message: 'You are not allowed to view policies',
		})
		const policies = await this.policyService.list(context.db)
		return policies.map(PolicyResponseFactory.toGraphQL)
	}

	async policy(_: unknown, { slug }: QueryPolicyArgs, context: TenantResolverContext): Promise<GraphQLPolicy | null> {
		await context.requireAccess({
			action: PermissionActions.POLICY_VIEW,
			message: 'You are not allowed to view policies',
		})
		const policy = await this.policyService.getBySlug(context.db, slug)
		return policy ? PolicyResponseFactory.toGraphQL(policy) : null
	}
}
