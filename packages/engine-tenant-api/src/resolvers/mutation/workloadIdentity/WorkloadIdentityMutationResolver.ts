import {
	ApplyWorkloadIdentityTrustResponse,
	DisableWorkloadIdentityTrustResponse,
	MutationApplyWorkloadIdentityTrustArgs,
	MutationDisableWorkloadIdentityTrustArgs,
	MutationResolvers,
} from '../../../schema/index.js'
import { TenantResolverContext } from '../../TenantResolverContext.js'
import { PermissionActions } from '../../../model/authorization/index.js'
import { WorkloadIdentityManager, WorkloadTrustApplyPlan } from '../../../model/service/workloadIdentity/apply/WorkloadIdentityManager.js'
import { ApplyResponse, createApplyError } from '../../../model/service/workloadIdentity/apply/applyErrors.js'
import { closureTargetToMembership } from '../../../model/service/workloadIdentity/apply/envelope.js'
import { isUnpersistedIdentityId } from '../../../model/service/apiKey/UnpersistedApiKeyManager.js'
import { ResponseOk } from '../../../model/utils/Response.js'
import { WorkloadIdentity } from '../../../model/type/index.js'
import { ImplementationException } from '../../../exceptions.js'
import { createErrorResponse } from '../../errorUtils.js'
import { parseWorkloadIdentityTrustInput } from './parseWorkloadIdentityTrustInput.js'
import { createWorkloadIdentityTrustResponse, envelopeClosureToJson, workloadTrustAuditSnapshot } from './workloadIdentityTrustResponse.js'

const workloadCredentialMessage = 'Workload identity trusts cannot be changed by a caller authenticated through a trust; '
	+ 'apply them with a person or api key credential'

export class WorkloadIdentityMutationResolver implements MutationResolvers {
	constructor(
		private readonly workloadIdentityManager: WorkloadIdentityManager,
	) {}

	async applyWorkloadIdentityTrust(
		parent: unknown,
		{ slug, trust }: MutationApplyWorkloadIdentityTrustArgs,
		context: TenantResolverContext,
	): Promise<ApplyWorkloadIdentityTrustResponse> {
		// a trust managing trusts would let whoever controls one workload re-point or create the others (§6a)
		if (context.credential.type === 'workload_trust') {
			return createErrorResponse('WORKLOAD_CREDENTIAL_FORBIDDEN', workloadCredentialMessage)
		}
		const existing = await this.workloadIdentityManager.findTrustBySlug(context.db, slug)
		await context.requireAccess({
			action: existing ? PermissionActions.WORKLOAD_IDENTITY_UPDATE : PermissionActions.WORKLOAD_IDENTITY_ADD,
			message: existing ? 'You are not allowed to update a workload identity trust' : 'You are not allowed to add a workload identity trust',
		})

		const definition = parseWorkloadIdentityTrustInput(trust)
		if (!definition.ok) {
			return createErrorResponse(definition)
		}
		const plan = await this.workloadIdentityManager.prepareApply(context.db, definition.result)
		if (!plan.ok) {
			return createErrorResponse(plan)
		}
		const authorization = await this.authorizePlan(context, plan.result, existing)
		if (!authorization.ok) {
			return createErrorResponse(authorization)
		}

		const createdBy = isUnpersistedIdentityId(context.identity.id) ? null : context.identity.id
		const result = await this.workloadIdentityManager.apply(context.db, slug, plan.result, createdBy, existing)
		if (!result.ok) {
			return createErrorResponse(result)
		}
		const [after] = await this.workloadIdentityManager.getTrustStates(context.db, { id: result.result.trustId })
		if (!after) {
			throw new ImplementationException(`Applied workload identity trust ${slug} not found`)
		}
		const envelopeClosure = envelopeClosureToJson(plan.result.closure)

		await context.logAuthAction({
			type: 'workload_identity_apply',
			response: new ResponseOk(null),
			trustId: result.result.trustId,
			eventData: {
				slug,
				trustId: result.result.trustId,
				created: result.result.created,
				tokensValidAfterBumped: result.result.tokensValidAfterBumped,
				before: result.result.before ? workloadTrustAuditSnapshot(result.result.before) : null,
				after: { ...workloadTrustAuditSnapshot(after), envelopeClosure },
			},
		})

		return {
			ok: true,
			result: {
				trust: createWorkloadIdentityTrustResponse(after),
				created: result.result.created,
				tokensValidAfterBumped: result.result.tokensValidAfterBumped,
				envelopeClosure,
			},
		}
	}

	async disableWorkloadIdentityTrust(
		parent: unknown,
		{ slug }: MutationDisableWorkloadIdentityTrustArgs,
		context: TenantResolverContext,
	): Promise<DisableWorkloadIdentityTrustResponse> {
		if (context.credential.type === 'workload_trust') {
			return createErrorResponse('WORKLOAD_CREDENTIAL_FORBIDDEN', workloadCredentialMessage)
		}
		await context.requireAccess({
			action: PermissionActions.WORKLOAD_IDENTITY_DISABLE,
			message: 'You are not allowed to disable a workload identity trust',
		})
		const trustId = await this.workloadIdentityManager.disable(context.db, slug)
		if (trustId === null) {
			return createErrorResponse('NOT_FOUND', `Workload identity trust ${slug} not found`)
		}

		await context.logAuthAction({
			type: 'workload_identity_disable',
			response: new ResponseOk(null),
			trustId,
			eventData: { slug, trustId },
		})

		return { ok: true }
	}

	/**
	 * Tenant roles reuse the `createGlobalApiKey` gate; memberships and bounded envelope targets are direct grants
	 * checked in the project scope like `addProjectMember`; an unbounded target needs global authority to add members (§6a, §7b).
	 */
	private async authorizePlan(
		context: TenantResolverContext,
		plan: WorkloadTrustApplyPlan,
		existing: WorkloadIdentity.TrustRow | null,
	): Promise<ApplyResponse<null>> {
		const { definition } = plan
		// Rewriting a trust re-points its identity, so the caller must be one who could have granted what it holds now.
		const existingAllowed = existing === null || existing.roles.length === 0 || await context.isAllowed({
			action: PermissionActions.API_KEY_CREATE_GLOBAL({ requestedRoles: existing.roles, trustForwardedClientInfo: false }),
		})
		if (!existingAllowed) {
			return createApplyError(
				'ROLE_NOT_ALLOWED',
				`You are not allowed to change a workload identity trust holding tenant roles ${existing.roles.join(', ')}`,
			)
		}
		const grantsGlobalCapability = definition.roles.length > 0 || definition.trustForwardedInfo
		const rolesAllowed = !grantsGlobalCapability || await context.isAllowed({
			action: PermissionActions.API_KEY_CREATE_GLOBAL({
				requestedRoles: definition.roles,
				trustForwardedClientInfo: definition.trustForwardedInfo,
			}),
		})
		if (!rolesAllowed) {
			return createApplyError(
				'ROLE_NOT_ALLOWED',
				`You are not allowed to grant tenant roles ${definition.roles.join(', ') || '(none)'}`
					+ (definition.trustForwardedInfo ? ' with trustForwardedInfo' : '')
					+ ' to a workload identity trust',
			)
		}

		for (const [slug, project] of plan.projects) {
			await context.requireAccess({
				scope: await context.permissionContext.createProjectScope(project),
				action: PermissionActions.PROJECT_ADD_MEMBER(
					definition.memberships.filter(it => it.project === slug).map(({ role, variables }) => ({ role, variables })),
				),
				message: 'You are not allowed to add a project member',
			})
		}

		const denied: { project: string; membershipRole: string; role: string }[] = []
		for (const entry of plan.closure) {
			const project = plan.projects.get(entry.project)
			if (!project) {
				throw new ImplementationException(`Project ${entry.project} is not part of the plan`)
			}
			for (const target of entry.targets) {
				const allowed = target.unbounded
					? await context.isAllowed({ action: PermissionActions.PROJECT_ADD_MEMBER([]) })
					: await context.isAllowed({
						scope: await context.permissionContext.createProjectScope(project),
						action: PermissionActions.PROJECT_ADD_MEMBER([closureTargetToMembership(target)]),
					})
				if (!allowed) {
					denied.push({ project: entry.project, membershipRole: entry.membership.role, role: target.role })
				}
			}
		}
		if (denied.length > 0) {
			return createApplyError(
				'ENVELOPE_NOT_AUTHORIZED',
				'You are not allowed to grant what these envelope rules open: '
					+ denied.map(it => `${it.project}/${it.membershipRole} → ${it.role}`).join(', '),
				denied,
			)
		}
		return new ResponseOk(null)
	}
}
