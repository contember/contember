import { Acl } from '@contember/schema'
import { getRoleVariables, MembershipResolver, MembershipValidationErrorType } from '@contember/schema-utils'
import { ClaimMappingMembership, ClaimMappingVariable } from './ClaimMapping.js'

/**
 * Why a granted membership in an A09 claim mapping is invalid against a project's live ACL schema.
 * Shared by config-time validation ({@link validateClaimMappingMembership} via
 * `IDPManager.assertValidClaimMapping`, which rejects the whole IdP config) and the apply-time backstop
 * (`IDPClaimSyncService`, which drops the unsafe grant), so the per-membership ACL validation can never
 * drift between the two. NOTE this shared check is ONLY the per-membership ACL validation; the rule-shape
 * checks (`findClaimMappingShapeErrors`) and the removed-key check (`findRemovedRuleKeys`, e.g. `grantRoles`)
 * run at config time only — the apply-time backstop deliberately re-checks just the ACL safety of each
 * grant, not the mapping's overall shape (a malformed shape can only arrive via an out-of-band JSONB edit
 * that bypassed config validation; `evaluateClaimMapping` then honours whatever shape it finds).
 */
export enum ClaimMappingMembershipErrorType {
	/** The granted role is not defined in the project ACL. */
	roleNotFound = 'roleNotFound',
	/** A membership variable is not defined for the granted role. */
	variableNotFound = 'variableNotFound',
	/** A predefined variable (identityID / personID) cannot be set — the runtime binds it to the signed-in identity. */
	predefinedVariable = 'predefinedVariable',
	/**
	 * A claim-derived (`from`) value would be written into a `condition` ACL variable without being bounded
	 * by an `allow` allowlist (or with `passthrough`). A condition variable's stored value is parsed as a
	 * row-level ACL condition at every content request, so this is an arbitrary-condition injection vector.
	 */
	conditionInjection = 'conditionInjection',
	/** A configured value targeting a `condition` variable is not a parseable ACL condition (it would deny at content time). */
	conditionValueInvalid = 'conditionValueInvalid',
}

export interface ClaimMappingMembershipError {
	readonly type: ClaimMappingMembershipErrorType
	readonly message: string
}

/**
 * Validate one A09 granted membership against a project's live ACL schema.
 *
 * The shared membership-shape checks (role exists, each set variable is defined for the role, a
 * predefined variable cannot be set, a `condition` variable's stored value parses as an ACL condition)
 * are DELEGATED to the very {@link MembershipResolver} the direct add-member path uses — so the IdP path
 * cannot drift from it. Only the resolver's `VARIABLE_EMPTY` is excluded: A09 grants are *partial* (a
 * rule sets only some of a role's variables), which is legitimate here but `VARIABLE_EMPTY` to the
 * resolver. On top of the shared checks A09 adds one claim-aware guard the resolver cannot know about —
 * the condition-injection guard (a claim-derived value must not flow unbounded into a `condition`
 * variable). See {@link ClaimMappingMembershipErrorType}.
 *
 * Returns every problem found (empty array = valid). The caller decides the consequence: config-time
 * validation throws on the first error (rejecting the whole IdP config), while the apply-time backstop
 * (`IDPClaimSyncService`) drops any grant that produces an error.
 *
 * Role / variable lookups are own-property only, so a name like `constructor` / `toString` cannot
 * resolve to an inherited Object.prototype member and pass as defined (the resolver and
 * `getRoleVariables` are likewise own-property guarded).
 */
export const validateClaimMappingMembership = (acl: Acl.Schema, membership: ClaimMappingMembership): ClaimMappingMembershipError[] => {
	const errors: ClaimMappingMembershipError[] = []
	const roleExists = Object.prototype.hasOwnProperty.call(acl.roles, membership.role)
	const roleVariables = roleExists ? getRoleVariables(membership.role, acl) : {}

	// A09-specific, claim-aware injection guard — MembershipResolver does not see `from`/`passthrough`/
	// `allow`. For a `condition` ACL variable, a claim-derived value is interpreted as a row-level ACL
	// condition on every content request, so it must be bounded by an explicit `allow` allowlist and must
	// not use `passthrough`. Constant `values` are configurer-controlled (their shape is validated by the
	// resolver below). Only checkable when the role resolves; an unknown role is reported as roleNotFound.
	if (roleExists) {
		for (const variable of membership.variables ?? []) {
			const aclVariable = Object.prototype.hasOwnProperty.call(roleVariables, variable.name) ? roleVariables[variable.name] : undefined
			if (
				aclVariable?.type === Acl.VariableType.condition && variable.from !== undefined && (variable.passthrough === true || variable.allow === undefined)
			) {
				errors.push({
					type: ClaimMappingMembershipErrorType.conditionInjection,
					message:
						`claimMapping variable '${variable.name}' of role '${membership.role}' is a condition variable: a claim-derived value is interpreted as a row-level ACL condition, so it must be constrained by an 'allow' allowlist and must not use 'passthrough'`,
				})
			}
		}
	}

	// Shared shape checks — delegate to MembershipResolver over the configurer-authored STATIC values the
	// mapping can deposit into each variable (constants + every `map` output + the `allow` allowlist), so a
	// malformed condition in ANY of them is rejected here rather than silently denying (`{ never: true }`)
	// on every content request once granted. Raw claim-derived values are unknown at validation time and
	// are bounded separately by the injection guard above.
	const resolverMembership: Acl.Membership = {
		role: membership.role,
		variables: (membership.variables ?? []).map(variable => ({ name: variable.name, values: staticVariableValues(variable) })),
	}
	const result = new MembershipResolver().resolve(acl, [resolverMembership], MembershipResolver.UnknownIdentity, false)
	for (const error of result.errors) {
		const translated = translateResolverError(error.error, membership, error.variable, roleVariables)
		if (translated) {
			errors.push(translated)
		}
	}
	return errors
}

/**
 * Every configurer-authored value the mapping could store into a variable: constant `values`, every
 * `map` output, and the `allow` allowlist (raw claim values are excluded — unknown at validation time
 * and bounded by the injection guard). De-duplicated; fed to the resolver so each is shape-checked.
 */
const staticVariableValues = (variable: ClaimMappingVariable): string[] => [
	...new Set([
		...(variable.values ?? []),
		...Object.values(variable.map ?? {}).flat(),
		...(variable.allow ?? []),
	]),
]

const translateResolverError = (
	type: MembershipValidationErrorType,
	membership: ClaimMappingMembership,
	variableName: string | undefined,
	roleVariables: Acl.Variables,
): ClaimMappingMembershipError | null => {
	const aclVariable = variableName && Object.prototype.hasOwnProperty.call(roleVariables, variableName) ? roleVariables[variableName] : undefined
	switch (type) {
		case MembershipValidationErrorType.ROLE_NOT_FOUND:
			return {
				type: ClaimMappingMembershipErrorType.roleNotFound,
				message: `claimMapping grants role '${membership.role}' which is not defined in the ACL of project '${membership.project}'`,
			}
		case MembershipValidationErrorType.VARIABLE_NOT_FOUND:
			// The resolver reports a (forbidden) predefined variable as VARIABLE_NOT_FOUND when not assumed;
			// surface A09's clearer `predefinedVariable` message when that is the actual cause.
			if (aclVariable?.type === Acl.VariableType.predefined) {
				return {
					type: ClaimMappingMembershipErrorType.predefinedVariable,
					message: `claimMapping cannot set the predefined variable '${variableName}' of role '${membership.role}'`,
				}
			}
			return {
				type: ClaimMappingMembershipErrorType.variableNotFound,
				message: `claimMapping sets variable '${variableName}' which is not defined for role '${membership.role}' in project '${membership.project}'`,
			}
		case MembershipValidationErrorType.VARIABLE_INVALID:
			// A predefined variable can also raise VARIABLE_INVALID (its non-id value) — already reported as
			// predefinedVariable above, so don't double-report it as a bad condition value.
			if (aclVariable?.type === Acl.VariableType.predefined) {
				return null
			}
			return {
				type: ClaimMappingMembershipErrorType.conditionValueInvalid,
				message:
					`claimMapping variable '${variableName}' of role '${membership.role}' is a condition variable, but a configured value (a constant, a 'map' output, or an 'allow' entry) is not a valid condition`,
			}
		case MembershipValidationErrorType.VARIABLE_EMPTY:
			// A09 intentionally tolerates partial grants — a rule may set only some of a role's variables.
			return null
		default:
			return null
	}
}
