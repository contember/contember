import { Acl } from '@contember/schema'
import { EvaluationContext, PolicySource, Statement } from '@contember/policy'
import { statementsForMembershipRule } from './membershipRuleStatements.js'

/**
 * Action emitted/queried by {@link AssumeMembershipPolicySource}.
 *
 * Asks: "may the caller assume this membership in this project?" The resource
 * is the project (`project:<slug>`); the subject under evaluation is the
 * assumed membership (build via `buildMembershipSubject`).
 */
export const ASSUME_MEMBERSHIP_ACTION = 'content:project.assumeMembership'

/**
 * Emits statements derived from `acl.roles[*].content.assumeMembership` so the
 * engine can decide "may caller assume this membership in this project?".
 *
 * For each invoker membership, the schema's `MembershipMatchRule` at
 * `acl.roles[invokerRole].content.assumeMembership` becomes one or more allow
 * statements for `content:project.assumeMembership` on `project:<slug>`.
 *
 * Used by engine-http's `ProjectMembershipResolver` to validate the
 * `X-Contember-Assume-Membership` header against the project ACL.
 */
export class AssumeMembershipPolicySource implements PolicySource {
	public readonly name = 'content-assume-membership'

	constructor(
		private readonly project: { slug: string; acl: Acl.Schema },
		private readonly invokerMemberships: readonly Acl.Membership[],
	) {}

	getStatements(_context: EvaluationContext): readonly Statement[] {
		const out: Statement[] = []
		const resource = `project:${this.project.slug}`
		for (const invoker of this.invokerMemberships) {
			const rule = this.project.acl.roles[invoker.role]?.content?.assumeMembership ?? {}
			out.push(
				...statementsForMembershipRule(
					invoker,
					rule,
					[ASSUME_MEMBERSHIP_ACTION],
					resource,
				),
			)
		}
		return out
	}
}
