import { Acl } from '@contember/schema'
import type { RemoteWorkloadIdentityTrust } from './model.js'

/**
 * An envelope rule the new schema leaves uncovered. At request time such a rule answers every assume
 * with 403 (§7a.2) until the rule names the new variables, or the removed role is dropped from it.
 */
export type EnvelopeCoverageIssue =
	& {
		readonly trust: string
		readonly project: string
		/** The role of the membership the rule is bound to. */
		readonly membershipRole: string
		/** The role the rule lets the workload assume. */
		readonly targetRole: string
	}
	& (
		| { readonly kind: 'role-missing' }
		| { readonly kind: 'variables-uncovered'; readonly variables: readonly string[] }
	)

export type EnvelopeCoverageResult =
	| { readonly status: 'checked'; readonly issues: readonly EnvelopeCoverageIssue[] }
	| { readonly status: 'skipped'; readonly reason: string }

/** Variables the caller must supply on an assume; `predefined` ones are always derived from the trust identity. */
const coveredVariableNames = (role: Acl.RolePermissions): string[] =>
	Object.entries(role.variables)
		.filter(([, variable]) => variable.type === Acl.VariableType.entity || variable.type === Acl.VariableType.condition)
		.map(([name]) => name)

const namedVariables = (rule: Acl.MembershipRoleMatchRule): readonly string[] | 'all' => {
	if (rule === true || rule.variables === true) {
		return 'all'
	}
	return Object.keys(rule.variables ?? {})
}

/** Lists the envelope rules of enabled trusts, on memberships of `project`, that `acl` (the schema about to be deployed) leaves uncovered. */
export const findUncoveredEnvelopeRules = (
	trusts: readonly RemoteWorkloadIdentityTrust[],
	project: string,
	acl: Acl.Schema,
): EnvelopeCoverageIssue[] => {
	const issues: EnvelopeCoverageIssue[] = []
	for (const trust of trusts) {
		if (trust.disabled) {
			continue
		}
		for (const membership of trust.memberships) {
			const rule = membership.assumeMembership
			// `true` grants every role with unbounded variables, `false` nothing — neither names a variable to miss
			if (membership.project !== project || rule === null || typeof rule === 'boolean') {
				continue
			}
			for (const [targetRole, roleRule] of Object.entries(rule)) {
				const base = { trust: trust.slug, project, membershipRole: membership.role, targetRole }
				const role = acl.roles[targetRole]
				if (role === undefined) {
					issues.push({ ...base, kind: 'role-missing' })
					continue
				}
				const named = namedVariables(roleRule)
				if (named === 'all') {
					continue
				}
				const missing = coveredVariableNames(role).filter(name => !named.includes(name))
				if (missing.length > 0) {
					issues.push({ ...base, kind: 'variables-uncovered', variables: missing })
				}
			}
		}
	}
	return issues
}

export const describeEnvelopeCoverageIssue = (issue: EnvelopeCoverageIssue): string => {
	const rule = `Workload identity ${issue.trust}: the envelope rule on ${issue.project}/${issue.membershipRole} for role ${issue.targetRole}`
	switch (issue.kind) {
		case 'role-missing':
			return `${rule} targets a role the new schema no longer defines.`
		case 'variables-uncovered':
			return `${rule} does not name variable(s) ${
				issue.variables.join(', ')
			} of the new schema; assuming it will be refused (403) until the rule names them.`
	}
}
