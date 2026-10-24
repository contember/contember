import { QueryCheckWorkloadIdentityTokenArgs, QueryResolvers, WorkloadIdentityTokenCheck, WorkloadIdentityTrust } from '../../schema/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'

export class WorkloadIdentityQueryResolver implements QueryResolvers {
	async workloadIdentityTrusts(parent: unknown, args: unknown, context: TenantResolverContext): Promise<readonly WorkloadIdentityTrust[]> {
		throw new Error('not implemented')
	}

	async checkWorkloadIdentityToken(
		parent: unknown,
		args: QueryCheckWorkloadIdentityTokenArgs,
		context: TenantResolverContext,
	): Promise<WorkloadIdentityTokenCheck> {
		throw new Error('not implemented')
	}
}
