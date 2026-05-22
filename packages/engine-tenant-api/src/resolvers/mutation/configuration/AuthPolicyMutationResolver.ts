import {
	AuthPolicyInput,
	CreateAuthPolicyResponse,
	DeleteAuthPolicyResponse,
	MutationCreateAuthPolicyArgs,
	MutationDeleteAuthPolicyArgs,
	MutationResolvers,
	MutationUpdateAuthPolicyArgs,
	UpdateAuthPolicyResponse,
} from '../../../schema'
import { TenantResolverContext } from '../../TenantResolverContext'
import { AuthPolicyManager, PermissionActions } from '../../../model'
import { createErrorResponse } from '../../errorUtils'
import { ResponseOk } from '../../../model/utils/Response'
import { JSONValue } from '@contember/schema'

/**
 * CRUD over `auth_policy` (per-role MFA / session policy). Gated like
 * `configure` (a tenant-wide admin action). Every mutation audits
 * `auth_policy_change` with a snapshot of the input. Shared infra reused by A19.
 */
export class AuthPolicyMutationResolver implements Pick<MutationResolvers, 'createAuthPolicy' | 'updateAuthPolicy' | 'deleteAuthPolicy'> {
	constructor(
		private readonly authPolicyManager: AuthPolicyManager,
	) {}

	async createAuthPolicy(parent: any, { policy }: MutationCreateAuthPolicyArgs, context: TenantResolverContext): Promise<CreateAuthPolicyResponse> {
		await context.requireAccess({
			action: PermissionActions.CONFIGURE,
			message: 'You are not allowed to manage auth policies',
		})

		const result = await this.authPolicyManager.createPolicy(context.db, this.mapInput(policy))
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await context.logAuthAction({
			type: 'auth_policy_change',
			response: new ResponseOk(null),
			eventData: {
				operation: 'create',
				id: result.result.id,
				policy: snapshotInput(policy),
			},
		})

		return { ok: true, result: { id: result.result.id } }
	}

	async updateAuthPolicy(
		parent: any,
		{ id, policy }: MutationUpdateAuthPolicyArgs,
		context: TenantResolverContext,
	): Promise<UpdateAuthPolicyResponse> {
		await context.requireAccess({
			action: PermissionActions.CONFIGURE,
			message: 'You are not allowed to manage auth policies',
		})

		const result = await this.authPolicyManager.updatePolicy(context.db, id, this.mapInput(policy))
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await context.logAuthAction({
			type: 'auth_policy_change',
			response: new ResponseOk(null),
			eventData: {
				operation: 'update',
				id,
				policy: snapshotInput(policy),
			},
		})

		return { ok: true }
	}

	async deleteAuthPolicy(parent: any, { id }: MutationDeleteAuthPolicyArgs, context: TenantResolverContext): Promise<DeleteAuthPolicyResponse> {
		await context.requireAccess({
			action: PermissionActions.CONFIGURE,
			message: 'You are not allowed to manage auth policies',
		})

		const result = await this.authPolicyManager.deletePolicy(context.db, id)
		if (!result.ok) {
			return createErrorResponse(result.error, result.errorMessage)
		}

		await context.logAuthAction({
			type: 'auth_policy_change',
			response: new ResponseOk(null),
			eventData: {
				operation: 'delete',
				id,
			},
		})

		return { ok: true }
	}

	private mapInput(policy: AuthPolicyInput) {
		return {
			scope: policy.scope,
			project: policy.project ?? null,
			roles: [...policy.roles],
			mfaRequired: policy.mfaRequired ?? null,
			tokenExpiration: policy.tokenExpiration ?? null,
			idleTimeout: policy.idleTimeout ?? null,
			graceDuration: policy.mfaGraceDuration ?? null,
			rememberMeAllowed: policy.rememberMeAllowed ?? null,
		}
	}
}

const snapshotInput = (policy: AuthPolicyInput): JSONValue => ({
	scope: policy.scope,
	project: policy.project ?? null,
	roles: [...policy.roles],
	mfaRequired: policy.mfaRequired ?? null,
	tokenExpiration: policy.tokenExpiration ?? null,
	idleTimeout: policy.idleTimeout ?? null,
	mfaGraceDuration: policy.mfaGraceDuration ?? null,
	rememberMeAllowed: policy.rememberMeAllowed ?? null,
})
