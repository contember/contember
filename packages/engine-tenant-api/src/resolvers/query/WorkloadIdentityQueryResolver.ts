import { QueryCheckWorkloadIdentityTokenArgs, QueryResolvers, WorkloadIdentityTokenCheck, WorkloadIdentityTrust } from '../../schema/index.js'
import { TenantResolverContext } from '../TenantResolverContext.js'
import { PermissionActions } from '../../model/authorization/index.js'
import { WorkloadIdentityManager } from '../../model/service/workloadIdentity/apply/WorkloadIdentityManager.js'
import { WorkloadTokenVerifier } from '../../model/service/workloadIdentity/verification/WorkloadTokenVerifier.js'
import { createWorkloadIdentityTrustResponse } from '../mutation/workloadIdentity/workloadIdentityTrustResponse.js'

export class WorkloadIdentityQueryResolver implements QueryResolvers {
	constructor(
		private readonly workloadIdentityManager: WorkloadIdentityManager,
		private readonly workloadTokenVerifier: WorkloadTokenVerifier,
	) {}

	async workloadIdentityTrusts(parent: unknown, args: unknown, context: TenantResolverContext): Promise<readonly WorkloadIdentityTrust[]> {
		await context.requireAccess({
			action: PermissionActions.WORKLOAD_IDENTITY_LIST,
			message: 'You are not allowed to list workload identity trusts',
		})
		const states = await this.workloadIdentityManager.getTrustStates(context.db, null)
		return states.map(createWorkloadIdentityTrustResponse)
	}

	async checkWorkloadIdentityToken(
		parent: unknown,
		{ token }: QueryCheckWorkloadIdentityTokenArgs,
		context: TenantResolverContext,
	): Promise<WorkloadIdentityTokenCheck> {
		await context.requireAccess({
			action: PermissionActions.WORKLOAD_IDENTITY_LIST,
			message: 'You are not allowed to check workload identity tokens',
		})
		const result = await this.workloadTokenVerifier.check(context.db, token)
		const [trust] = result.trust ? await this.workloadIdentityManager.getTrustStates(context.db, { id: result.trust.id }) : []
		const trustResponse = trust ? createWorkloadIdentityTrustResponse(trust) : null
		const requiresDpop = result.trust?.requireDpop ?? null
		if (result.ok) {
			return { ok: true, trust: trustResponse, claims: result.claims, requiresDpop }
		}
		return {
			ok: false,
			trust: trustResponse,
			requiresDpop,
			failure: {
				step: result.failure.step,
				message: result.failure.message,
				conditionIndex: result.failure.conditionIndex ?? null,
				actualValue: result.failure.actualValue ?? null,
			},
		}
	}
}
