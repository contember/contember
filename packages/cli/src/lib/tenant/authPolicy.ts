interface AuthPolicyIdentity {
	scope: string
	project?: string | null
	roles: readonly string[]
}

/**
 * Identity of a policy for reconciliation purposes. `auth_policy` has no unique
 * constraint beyond its generated id, so the config is matched against existing
 * rows by what the policy actually *targets*: a scope, an optional project and a
 * set of roles. Roles are sorted because `AuthPolicyResolver` treats them as a
 * set (it matches with `roles.some(...)`), so ordering carries no meaning.
 */
export const authPolicyKey = (policy: AuthPolicyIdentity): string => JSON.stringify([policy.scope, policy.project ?? null, [...policy.roles].sort()])

/** Human-readable label for logs and error messages. */
export const describeAuthPolicy = (policy: AuthPolicyIdentity): string => {
	const target = policy.scope === 'project' ? `project:${policy.project ?? '?'}` : 'global'
	return `${target} [${[...policy.roles].sort().join(', ')}]`
}
