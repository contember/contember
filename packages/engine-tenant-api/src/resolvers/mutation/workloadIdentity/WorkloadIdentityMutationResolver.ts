import {
	ApplyWorkloadIdentityTrustResponse,
	DisableWorkloadIdentityTrustResponse,
	MutationApplyWorkloadIdentityTrustArgs,
	MutationDisableWorkloadIdentityTrustArgs,
	MutationResolvers,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'

export class WorkloadIdentityMutationResolver implements MutationResolvers {
	async applyWorkloadIdentityTrust(
		parent: unknown,
		args: MutationApplyWorkloadIdentityTrustArgs,
		context: TenantResolverContext,
	): Promise<ApplyWorkloadIdentityTrustResponse> {
		throw new Error('not implemented')
	}

	async disableWorkloadIdentityTrust(
		parent: unknown,
		args: MutationDisableWorkloadIdentityTrustArgs,
		context: TenantResolverContext,
	): Promise<DisableWorkloadIdentityTrustResponse> {
		throw new Error('not implemented')
	}
}
