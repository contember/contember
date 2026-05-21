import { Policy } from '@contember/policy'
import { ForbiddenError } from '@contember/graphql-utils'
import { DatabaseContext } from '../utils'
import { AssignPolicyCommand, CreatePolicyCommand, DeletePolicyCommand, RevokePolicyCommand, UpdatePolicyCommand } from './commands'
import { ListPoliciesQuery, PoliciesByIdsQuery, PolicyBySlugQuery } from './queries'
import { IdentityPolicyAssignmentsQuery } from './queries/IdentityPolicyAssignmentsQuery'
import { IdentityQuery } from '../queries/identity/IdentityQuery'
import { IdentityPolicyAssignment, PolicyDto } from './PolicyDto'
import { validateAssignmentTags, validatePolicyDocument, validatePolicySlug } from './validation'
import { assertWithinGrantableSurface, PolicyActor } from './grantBoundary'
import { bakeAssignmentTags } from './TenantDbPolicyProvider'
import { TenantRole } from '../authorization/Roles'

/**
 * Roles a policy mutation must never touch on a target identity unless the
 * actor is a super admin — mirrors the legacy `projectAdminUseRolesVerifier`,
 * which forbade operating on identities holding these roles. Without this, a
 * delegate granted `tenant:policy.assign` could assign (or revoke) within-surface
 * policies — including deny statements — on a super admin / project creator,
 * which the grant boundary alone does not prevent (it bounds *what* is granted,
 * not *who* it is granted to).
 */
const PROTECTED_TARGET_ROLES: readonly string[] = [TenantRole.SUPER_ADMIN, TenantRole.PROJECT_CREATOR]

/**
 * Service-layer facade over user-defined policy CRUD.
 *
 * Action-level access (can this caller call `createPolicy` at all?) is checked
 * in the resolver layer via `requireAccess`. This service enforces the
 * orthogonal *grant boundary*: a caller may only create/assign/remove a policy
 * whose every statement stays within its own grantable surface — preventing
 * privilege escalation (and lifting deny-guards) beyond the caller's own
 * permissions. See `grantBoundary.ts`.
 *
 * Built-in policies are code-only (`BUILTIN_POLICIES` in `builtinPolicies.ts`)
 * and never reach this service; the `builtin:` slug prefix is reserved by
 * `validatePolicySlug`.
 */
export class PolicyService {
	async list(db: DatabaseContext): Promise<PolicyDto[]> {
		return db.queryHandler.fetch(new ListPoliciesQuery())
	}

	async getBySlug(db: DatabaseContext, slug: string): Promise<PolicyDto | null> {
		return db.queryHandler.fetch(new PolicyBySlugQuery(slug))
	}

	async create(
		db: DatabaseContext,
		actor: PolicyActor,
		input: { slug: string; label?: string; description?: string; document: Policy },
	): Promise<{ id: string }> {
		validatePolicySlug(input.slug)
		validatePolicyDocument(input.document)
		// The grant-boundary check reads the actor's own surface; doing it and the
		// write in one REPEATABLE READ transaction closes the window where a
		// concurrent change to the actor's policies could let an out-of-surface
		// document slip in between the check and the insert.
		return db.transaction(async db => {
			await assertWithinGrantableSurface(db, actor, [input.document])
			return db.commandBus.execute(
				new CreatePolicyCommand({
					slug: input.slug,
					label: input.label,
					description: input.description,
					document: input.document,
				}),
			)
		})
	}

	async update(
		db: DatabaseContext,
		actor: PolicyActor,
		slug: string,
		input: { label?: string; description?: string | null; document?: Policy },
	): Promise<{ updated: boolean }> {
		if (input.document !== undefined) {
			validatePolicyDocument(input.document)
		}
		// Read-check-write in one transaction: the existing document, the boundary
		// check against both states, and the update must see a consistent snapshot.
		return db.transaction(async db => {
			const existing = await this.getBySlug(db, slug)
			if (!existing) {
				throw new PolicyNotFoundError(slug)
			}
			// Both states must be within the actor's surface: the new document so it
			// cannot grant beyond the actor, the old one so the actor cannot strip a
			// deny it does not itself hold (which would escalate the assignees).
			await assertWithinGrantableSurface(db, actor, [existing.document, input.document ?? existing.document])
			return db.commandBus.execute(new UpdatePolicyCommand({ slug, ...input }))
		})
	}

	async delete(db: DatabaseContext, actor: PolicyActor, slug: string): Promise<{ deleted: boolean }> {
		return db.transaction(async db => {
			const existing = await this.getBySlug(db, slug)
			if (!existing) {
				return { deleted: false }
			}
			await assertWithinGrantableSurface(db, actor, [existing.document])
			return db.commandBus.execute(new DeletePolicyCommand(slug))
		})
	}

	async assign(
		db: DatabaseContext,
		actor: PolicyActor,
		identityId: string,
		policySlug: string,
		tags: Record<string, unknown> = {},
	): Promise<void> {
		validateAssignmentTags(tags)
		await db.transaction(async db => {
			await this.assertCanTargetIdentity(db, actor, identityId)
			const policy = await this.getBySlug(db, policySlug)
			if (!policy) {
				throw new PolicyNotFoundError(policySlug)
			}
			// Check the document as it will actually be baked for this assignment —
			// per-assignment tags narrow `${assignment.tags.*}` placeholders, so a
			// tag-scoped policy is checked against its concrete scope, not `*`.
			const baked: Policy = {
				version: policy.document.version,
				statements: policy.document.statements.map(stmt => bakeAssignmentTags(stmt, { assignment: { tags, policySlug } })),
			}
			await assertWithinGrantableSurface(db, actor, [baked])
			await db.commandBus.execute(
				new AssignPolicyCommand({
					identityId,
					policyId: policy.id,
					tags,
					grantedBy: actor.id,
				}),
			)
		})
	}

	async revoke(db: DatabaseContext, actor: PolicyActor, identityId: string, policySlug: string): Promise<{ revoked: boolean }> {
		return db.transaction(async db => {
			await this.assertCanTargetIdentity(db, actor, identityId)
			const policy = await this.getBySlug(db, policySlug)
			if (!policy) {
				return { revoked: false }
			}
			// Revoking removes the policy's (possibly deny-bearing) statements from the
			// target; the actor must hold every action involved. Placeholders widen to
			// `*` here — conservative across whatever tags the assignment carried.
			await assertWithinGrantableSurface(db, actor, [policy.document])
			return db.commandBus.execute(new RevokePolicyCommand(identityId, policy.id))
		})
	}

	/**
	 * Forbid assigning/revoking policies on a more-privileged identity. A super
	 * admin actor may target anyone; everyone else (e.g. a delegate granted
	 * `tenant:policy.assign`) cannot target an identity holding a protected role.
	 * Throws `ForbiddenError`, surfaced the same way as the resolver's
	 * action-level `requireAccess` failure.
	 */
	private async assertCanTargetIdentity(db: DatabaseContext, actor: PolicyActor, targetIdentityId: string): Promise<void> {
		if (actor.roles.includes(TenantRole.SUPER_ADMIN)) {
			return
		}
		const [target] = await db.queryHandler.fetch(new IdentityQuery([targetIdentityId]))
		if (!target) {
			// Existence is reported by the resolver's own check; nothing to guard.
			return
		}
		if (target.roles.some(role => PROTECTED_TARGET_ROLES.includes(role))) {
			throw new ForbiddenError('You are not allowed to manage policies of this identity')
		}
	}

	async listAssignedPolicies(db: DatabaseContext, identityId: string): Promise<PolicyDto[]> {
		const assignments = await db.queryHandler.fetch(new IdentityPolicyAssignmentsQuery(identityId))
		if (assignments.length === 0) return []
		return db.queryHandler.fetch(new PoliciesByIdsQuery(assignments.map(a => a.policyId)))
	}

	async listAssignments(db: DatabaseContext, identityId: string): Promise<IdentityPolicyAssignment[]> {
		return db.queryHandler.fetch(new IdentityPolicyAssignmentsQuery(identityId))
	}
}

export class PolicyNotFoundError extends Error {
	constructor(public readonly slug: string) {
		super(`Policy not found: ${slug}`)
	}
}
