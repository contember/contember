import { Acl } from '@contember/schema'
import { Connection, UniqueViolationError } from '@contember/database'
import { MembershipResolver } from '@contember/schema-utils'
import { DatabaseContext } from '../../../utils/index.js'
import { Project, ProjectSchemaResolver, WorkloadIdentity } from '../../../type/index.js'
import { ResponseOk } from '../../../utils/Response.js'
import { ImplementationException } from '../../../../exceptions.js'
import { ProjectBySlugQuery } from '../../../queries/project/ProjectBySlugQuery.js'
import { WorkloadAssumeRulesQuery } from '../../../queries/workloadIdentity/WorkloadAssumeRulesQuery.js'
import { WorkloadIdentityMembershipsQuery } from '../../../queries/workloadIdentity/WorkloadIdentityMembershipsQuery.js'
import { WorkloadTrustDetailFilter, WorkloadTrustDetailQuery } from '../../../queries/workloadIdentity/WorkloadTrustDetailQuery.js'
import { CreateIdentityCommand } from '../../../commands/identity/CreateIdentityCommand.js'
import { CreateOrUpdateProjectMembershipCommand } from '../../../commands/membership/CreateOrUpdateProjectMembershipCommand.js'
import { RemoveProjectMembershipCommand } from '../../../commands/membership/RemoveProjectMembershipCommand.js'
import { CreateWorkloadTrustCommand } from '../../../commands/workloadIdentity/CreateWorkloadTrustCommand.js'
import { DisableWorkloadTrustCommand } from '../../../commands/workloadIdentity/DisableWorkloadTrustCommand.js'
import { ReplaceWorkloadAssumeRulesCommand } from '../../../commands/workloadIdentity/ReplaceWorkloadAssumeRulesCommand.js'
import { UpdateWorkloadIdentityCommand } from '../../../commands/workloadIdentity/UpdateWorkloadIdentityCommand.js'
import { UpdateWorkloadTrustCommand } from '../../../commands/workloadIdentity/UpdateWorkloadTrustCommand.js'
import { GlobalRoleValidator } from '../../GlobalRoleValidator.js'
import { ApplyResponse, createApplyError } from './applyErrors.js'
import { fetchWorkloadTrustStates, parseStoredAssumeRule, WorkloadTrustMembership, WorkloadTrustState } from './workloadTrustStates.js'
import { EnvelopeClosureTarget, EnvelopeRuleError, expandEnvelope } from './envelope.js'
import { CanonicalMembershipDefinition, CanonicalTrustDefinition, principalSelectionKey, validateTrustDefinition } from './trustDefinition.js'

/** An envelope rule together with the stored membership it was declared on (§7a.1). */
export interface WorkloadAssumeRule {
	readonly membership: Acl.Membership
	readonly rule: Acl.MembershipMatchRule
}

/** The authorized envelope of one source membership (§7b), as the apply plan prints it. */
export interface EnvelopeClosureEntry {
	readonly project: string
	readonly membership: Acl.Membership
	readonly targets: readonly EnvelopeClosureTarget[]
}

/** A definition that passed every check needing no caller authorization. */
export interface WorkloadTrustApplyPlan {
	readonly definition: CanonicalTrustDefinition
	/** By slug, for every project a membership names. */
	readonly projects: ReadonlyMap<string, Project>
	readonly closure: readonly EnvelopeClosureEntry[]
}

export interface WorkloadTrustApplyResult {
	readonly trustId: string
	readonly created: boolean
	readonly tokensValidAfterBumped: boolean
	readonly before: WorkloadTrustState | null
}

const ENABLED_ISSUER_AUDIENCE_INDEX = 'workload_identity_trust_enabled_issuer_audience_idx'

const sameMembershipVariables = (a: readonly Acl.MembershipVariable[], b: readonly Acl.MembershipVariable[]) =>
	a.length === b.length
	&& a.every(variable => {
		const other = b.find(it => it.name === variable.name)
		return other !== undefined && other.values.length === variable.values.length && variable.values.every(it => other.values.includes(it))
	})

export class WorkloadIdentityManager {
	constructor(
		private readonly projectSchemaResolver: ProjectSchemaResolver,
		private readonly globalRoleValidator: GlobalRoleValidator,
		private readonly instanceConfig: WorkloadIdentity.InstanceConfig,
		private readonly membershipResolver: MembershipResolver = new MembershipResolver(),
	) {}

	/** Envelope rules of one trust in one project; a membership without a rule grants no assumption. */
	public async getAssumeRules(db: DatabaseContext, trustId: string, projectSlug: string): Promise<readonly WorkloadAssumeRule[]> {
		const rows = await db.queryHandler.fetch(new WorkloadAssumeRulesQuery(trustId, projectSlug))
		return rows.map(row => ({
			membership: { role: row.role, variables: row.variables },
			rule: parseStoredAssumeRule(row.rule),
		}))
	}

	public async findTrustByIdentity(db: DatabaseContext, identityId: string): Promise<WorkloadIdentity.TrustRow | null> {
		const [detail] = await db.queryHandler.fetch(new WorkloadTrustDetailQuery({ identityIds: [identityId] }))
		return detail?.trust ?? null
	}

	public async findTrustBySlug(db: DatabaseContext, slug: string): Promise<WorkloadIdentity.TrustRow | null> {
		const [detail] = await db.queryHandler.fetch(new WorkloadTrustDetailQuery({ slug }))
		return detail?.trust ?? null
	}

	/** Every trust (`null`) or the matching ones, each with its full applied definition. */
	public async getTrustStates(db: DatabaseContext, filter: WorkloadTrustDetailFilter | null): Promise<readonly WorkloadTrustState[]> {
		return await fetchWorkloadTrustStates(db, filter)
	}

	/**
	 * Validates the definition against the instance policy, the profile and the current project schemas, and expands
	 * the envelope closure. Authorizing the caller for the plan is up to the caller of {@link apply}.
	 */
	public async prepareApply(db: DatabaseContext, definition: WorkloadIdentity.TrustDefinition): Promise<ApplyResponse<WorkloadTrustApplyPlan>> {
		const validated = validateTrustDefinition(definition, this.instanceConfig)
		if (!validated.ok) {
			return validated
		}
		const canonical = validated.result

		const projectSlugs = [...new Set(canonical.memberships.map(it => it.project))]
		const projects = new Map<string, Project>()
		for (const slug of projectSlugs) {
			const project = await db.queryHandler.fetch(new ProjectBySlugQuery(slug))
			if (project) {
				projects.set(slug, project)
			}
		}
		const missing = projectSlugs.filter(it => !projects.has(it))
		if (missing.length > 0) {
			return createApplyError('PROJECT_NOT_FOUND', `Project ${missing.join(', ')} was not found`, missing)
		}

		const membershipErrors: { project: string; role: string; variable: string | null; error: string }[] = []
		const envelopeErrors: (EnvelopeRuleError & { project: string; membershipRole: string })[] = []
		const closure: EnvelopeClosureEntry[] = []
		for (const slug of projectSlugs) {
			const schema = await this.projectSchemaResolver.getSchema(slug)
			if (!schema) {
				throw new ImplementationException(`Schema of project ${slug} cannot be resolved`)
			}
			const projectMemberships = canonical.memberships.filter(it => it.project === slug)
			const validation = this.membershipResolver.resolve(
				schema.acl,
				projectMemberships.map(({ role, variables }) => ({ role, variables })),
				MembershipResolver.UnknownIdentity,
				false,
			)
			membershipErrors.push(...validation.errors.map(it => ({ project: slug, role: it.role, variable: it.variable ?? null, error: it.error })))

			for (const membership of projectMemberships) {
				if (membership.assumeMembership === null) {
					continue
				}
				const expanded = expandEnvelope(schema.acl, membership, membership.assumeMembership)
				if (!expanded.ok) {
					envelopeErrors.push(...expanded.errors.map(it => ({ ...it, project: slug, membershipRole: membership.role })))
					continue
				}
				closure.push({ project: slug, membership: { role: membership.role, variables: membership.variables }, targets: expanded.targets })
			}
		}
		if (membershipErrors.length > 0) {
			return createApplyError(
				'INVALID_MEMBERSHIP',
				'Invalid memberships: ' + membershipErrors.map(it => `${it.project}/${it.role}${it.variable ? `/${it.variable}` : ''}: ${it.error}`).join('; '),
				membershipErrors,
			)
		}
		if (envelopeErrors.length > 0) {
			return createApplyError(
				'INVALID_ENVELOPE',
				'Invalid envelope rules: '
					+ envelopeErrors
						.map(it => `${it.project}/${it.membershipRole} → ${it.role ?? '*'}${it.variable ? `/${it.variable}` : ''}: ${it.message}`)
						.join('; '),
				envelopeErrors.map(({ project, membershipRole, role, variable, message }) => ({
					project,
					membershipRole,
					role,
					variable: variable ?? null,
					message,
				})),
			)
		}

		return new ResponseOk({ definition: canonical, projects, closure })
	}

	/**
	 * Writes an authorized plan in one transaction: the identity, the trust row, memberships reconciled to exactly the
	 * declared set and the envelope rules bound to them. `tokens_valid_after` moves only when the principal selection
	 * changed or the trust is re-enabled (§6).
	 */
	public async apply(
		db: DatabaseContext,
		slug: string,
		plan: WorkloadTrustApplyPlan,
		createdBy: string | null,
	): Promise<ApplyResponse<WorkloadTrustApplyResult>> {
		const definition = plan.definition
		try {
			// Repeatable read: a concurrent apply of the same trust fails with a serialization error instead of
			// deciding the bump on a stale row.
			return await db.transaction(async trx => {
				const invalidRole = await this.globalRoleValidator.findInvalidRole(trx, definition.roles)
				if (invalidRole !== null) {
					return createApplyError('INVALID_DEFINITION', `Role ${invalidRole} is not valid or globally assignable`)
				}
				const [existing] = await this.getTrustStates(trx, { slug })

				let trustId: string
				let identityId: string
				let bumped = false
				if (existing) {
					trustId = existing.trust.id
					identityId = existing.trust.identityId
					bumped = principalSelectionKey(existing.trust) !== principalSelectionKey(definition) || (existing.trust.disabled && !definition.disabled)
					await trx.commandBus.execute(new UpdateWorkloadIdentityCommand(identityId, definition.roles, definition.description))
					await trx.commandBus.execute(new UpdateWorkloadTrustCommand(trustId, definition, bumped))
				} else {
					identityId = await trx.commandBus.execute(new CreateIdentityCommand(definition.roles, definition.description ?? undefined))
					trustId = await trx.commandBus.execute(new CreateWorkloadTrustCommand(slug, identityId, definition, createdBy))
				}

				await this.reconcileMemberships(trx, trustId, identityId, plan, existing?.memberships ?? [])

				return new ResponseOk({ trustId, created: !existing, tokensValidAfterBumped: bumped, before: existing ?? null })
			})
		} catch (e) {
			// A unique violation aborts the transaction, so it is mapped once the transaction has rolled back.
			if (e instanceof UniqueViolationError && e.constraint === ENABLED_ISSUER_AUDIENCE_INDEX) {
				return createApplyError(
					'AUDIENCE_IN_USE',
					`Another enabled trust already admits issuer ${definition.issuer} with audience ${definition.audience}`,
				)
			}
			throw e
		}
	}

	/** Returns the id of the disabled trust, or `null` when no trust has the slug. */
	public async disable(db: DatabaseContext, slug: string): Promise<string | null> {
		return await db.commandBus.execute(new DisableWorkloadTrustCommand(slug))
	}

	private async reconcileMemberships(
		db: DatabaseContext<Connection.TransactionLike>,
		trustId: string,
		identityId: string,
		plan: WorkloadTrustApplyPlan,
		stored: readonly WorkloadTrustMembership[],
	): Promise<void> {
		const declared = plan.definition.memberships
		const projectId = (membership: CanonicalMembershipDefinition) => {
			const project = plan.projects.get(membership.project)
			if (!project) {
				throw new ImplementationException(`Project ${membership.project} is not part of the plan`)
			}
			return project.id
		}
		const findStored = (membership: CanonicalMembershipDefinition) =>
			stored.find(it => it.project === membership.project && it.role === membership.role)

		for (const membership of stored) {
			if (!declared.some(it => it.project === membership.project && it.role === membership.role)) {
				await db.commandBus.execute(new RemoveProjectMembershipCommand(membership.projectId, identityId, membership.role))
			}
		}
		let membershipRowsReplaced = false
		for (const membership of declared) {
			const current = findStored(membership)
			if (current && sameMembershipVariables(current.variables, membership.variables)) {
				continue
			}
			// a dropped variable is cleared only by re-creating the row; its rules are replaced below anyway
			if (current?.variables.some(variable => !membership.variables.some(it => it.name === variable.name))) {
				await db.commandBus.execute(new RemoveProjectMembershipCommand(current.projectId, identityId, current.role))
				membershipRowsReplaced = true
			}
			if (!current) {
				membershipRowsReplaced = true
			}
			await db.commandBus.execute(
				new CreateOrUpdateProjectMembershipCommand(projectId(membership), identityId, {
					role: membership.role,
					variables: membership.variables.map(it => ({ name: it.name, set: it.values })),
				}),
			)
		}

		const declaredRules = declared.filter(it => it.assumeMembership !== null)
		if (declaredRules.length === 0 && stored.every(it => it.assumeMembership === null)) {
			return
		}
		const membershipIds = membershipRowsReplaced
			? (await db.queryHandler.fetch(new WorkloadIdentityMembershipsQuery([identityId]))).map(it => ({
				id: it.id,
				project: it.projectSlug,
				role: it.role,
			}))
			: stored
		const rules = declaredRules.map(membership => {
			const row = membershipIds.find(it => it.project === membership.project && it.role === membership.role)
			if (!row || membership.assumeMembership === null) {
				throw new ImplementationException(`Membership ${membership.project}/${membership.role} was not written`)
			}
			return { membershipId: row.id, rule: membership.assumeMembership }
		})
		await db.commandBus.execute(new ReplaceWorkloadAssumeRulesCommand(trustId, rules))
	}
}
