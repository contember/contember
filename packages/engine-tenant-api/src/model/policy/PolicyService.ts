import { Policy } from '@contember/policy'
import { DatabaseContext } from '../utils'
import { AssignPolicyCommand, CreatePolicyCommand, DeletePolicyCommand, RevokePolicyCommand, UpdatePolicyCommand } from './commands'
import { ListPoliciesQuery, PoliciesByIdsQuery, PolicyBySlugQuery } from './queries'
import { IdentityPolicyAssignmentsQuery } from './queries/IdentityPolicyAssignmentsQuery'
import { IdentityPolicyAssignment, PolicyDto } from './PolicyDto'
import { validateAssignmentTags, validatePolicyDocument, validatePolicySlug } from './validation'

/**
 * Service-layer facade over user-defined policy CRUD. Does NOT perform
 * authorization checks — those belong in the resolver layer.
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

	async create(db: DatabaseContext, input: { slug: string; label?: string; description?: string; document: Policy }): Promise<{ id: string }> {
		validatePolicySlug(input.slug)
		validatePolicyDocument(input.document)
		return db.commandBus.execute(
			new CreatePolicyCommand({
				slug: input.slug,
				label: input.label,
				description: input.description,
				document: input.document,
			}),
		)
	}

	async update(
		db: DatabaseContext,
		slug: string,
		input: { label?: string; description?: string | null; document?: Policy },
	): Promise<{ updated: boolean }> {
		const existing = await this.getBySlug(db, slug)
		if (!existing) {
			throw new PolicyNotFoundError(slug)
		}
		if (input.document !== undefined) {
			validatePolicyDocument(input.document)
		}
		return db.commandBus.execute(new UpdatePolicyCommand({ slug, ...input }))
	}

	async delete(db: DatabaseContext, slug: string): Promise<{ deleted: boolean }> {
		return db.commandBus.execute(new DeletePolicyCommand(slug))
	}

	async assign(
		db: DatabaseContext,
		identityId: string,
		policySlug: string,
		tags: Record<string, unknown> = {},
		grantedBy: string | null = null,
	): Promise<void> {
		validateAssignmentTags(tags)
		const policy = await this.getBySlug(db, policySlug)
		if (!policy) {
			throw new PolicyNotFoundError(policySlug)
		}
		await db.commandBus.execute(
			new AssignPolicyCommand({
				identityId,
				policyId: policy.id,
				tags,
				grantedBy,
			}),
		)
	}

	async revoke(db: DatabaseContext, identityId: string, policySlug: string): Promise<{ revoked: boolean }> {
		const policy = await this.getBySlug(db, policySlug)
		if (!policy) {
			return { revoked: false }
		}
		return db.commandBus.execute(new RevokePolicyCommand(identityId, policy.id))
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
