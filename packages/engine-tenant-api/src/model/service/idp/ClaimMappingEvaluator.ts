import { ClaimMapping, ClaimMappingMembership, ClaimMappingRule, ClaimMappingVariable, ClaimValueSource, isRecord } from './ClaimMapping.js'

export type MappedMembership = {
	readonly project: string
	readonly role: string
	readonly variables: readonly { readonly name: string; readonly values: readonly string[] }[]
}

/**
 * Evaluate every rule of a claim mapping against the claims of an IdP response and collect the union
 * of granted project memberships (keyed implicitly by (project, role)). Pure: no DB, no side effects —
 * the caller decides how to apply the result (and whether to add-only or replace, per `unmatched`).
 */
export const evaluateClaimMapping = (mapping: ClaimMapping, claims: Record<string, unknown>): MappedMembership[] => {
	const membershipByKey = new Map<string, MappedMembership>()

	for (const rule of mapping.rules) {
		if (!ruleMatches(rule, readClaim(claims, rule.claim))) {
			continue
		}
		if (rule.grantMembership) {
			const membership = toMembership(rule.grantMembership, claims)
			// JSON-encode the (project, role) pair so the dedup key can't collide on a delimiter that a
			// slug could itself contain (a plain `${project}::${role}` would fold `a::b`/`c` into `a`/`b::c`).
			const key = JSON.stringify([membership.project, membership.role])
			const existing = membershipByKey.get(key)
			membershipByKey.set(key, existing ? mergeMembershipVariables(existing, membership) : membership)
		}
	}

	return [...membershipByKey.values()]
}

/**
 * Read a rule's match claim by its (flat) key. Own-property only: a claim named `__proto__` /
 * `constructor` / `toString` must not resolve to an always-present inherited member and thereby
 * presence-match every sign-in. Rule claims are flat keys (unlike a variable's `from.claim`, which
 * is a dot-path); a dotted name simply won't be found here.
 */
const readClaim = (claims: Record<string, unknown>, claim: string): unknown =>
	Object.prototype.hasOwnProperty.call(claims, claim) ? claims[claim] : undefined

const toMembership = (membership: ClaimMappingMembership, claims: Record<string, unknown>): MappedMembership => ({
	project: membership.project,
	role: membership.role,
	// Union by name so a single grant that lists the same variable twice (e.g. two `locale` entries)
	// combines their values into one entry, rather than emitting duplicate entries that would later race
	// and clobber each other when each is written as a full-replace of the same (membership, variable).
	variables: unionVariablesByName(
		(membership.variables ?? []).map(variable => ({ name: variable.name, values: resolveVariableValues(variable, claims) })),
	),
})

/**
 * Merge two grants of the same (project, role) by unioning their membership variables per name — so
 * several matching rules granting the same membership combine their variables (consistent with how
 * global roles union), rather than the last rule silently overwriting the variables of the earlier ones.
 */
const mergeMembershipVariables = (a: MappedMembership, b: MappedMembership): MappedMembership => ({
	project: a.project,
	role: a.role,
	variables: unionVariablesByName([...a.variables, ...b.variables]),
})

/**
 * Union a list of membership variables by name: several entries for the same variable name — whether from
 * one grant listing it twice or from several rules granting the same membership — combine their values into
 * a single entry. Values are de-duplicated and SORTED so the result is canonical: the same effective grant
 * always yields the same value array regardless of claim/rule order. That keeps the persisted JSON stable
 * (no redundant rewrite when an IdP returns a multi-valued claim in a different order across sign-ins) and
 * the audit delta order-insensitive. Variable entries keep first-seen order.
 */
const unionVariablesByName = (
	variables: readonly { readonly name: string; readonly values: readonly string[] }[],
): { name: string; values: string[] }[] => {
	const valuesByName = new Map<string, Set<string>>()
	for (const variable of variables) {
		const values = valuesByName.get(variable.name) ?? new Set<string>()
		for (const value of variable.values) {
			values.add(value)
		}
		valuesByName.set(variable.name, values)
	}
	return [...valuesByName].map(([name, values]) => ({ name, values: [...values].sort() }))
}

/**
 * Resolve a membership variable to its final string values: constant `values` (always kept) unioned
 * with values derived from `from` (extracted from the claims, then mapped / passed through / allow-
 * filtered). Pure; an empty result simply means the variable is not applied — `IDPClaimSyncService`
 * drops empty-valued variables so an empty `set` never soft-deletes the membership.
 */
export const resolveVariableValues = (variable: ClaimMappingVariable, claims: Record<string, unknown>): string[] => {
	const values = new Set<string>(variable.values ?? [])
	if (variable.from) {
		const allow = variable.allow ? new Set(variable.allow) : null
		for (const raw of extractClaimValues(variable.from, claims)) {
			// `raw` is an external claim value used as a `map` key — look it up as an OWN property only.
			// A plain `map?.[raw]` would let a hostile claim like `__proto__` / `constructor` resolve to an
			// inherited prototype member (a non-array object/function), which then slips past `?? []` and
			// throws `not iterable` in the loop below — aborting the sign-in transaction.
			const mapped = variable.map && Object.prototype.hasOwnProperty.call(variable.map, raw)
				? variable.map[raw]
				: (variable.passthrough ? [raw] : [])
			for (const value of mapped) {
				if (!allow || allow.has(value)) {
					values.add(value)
				}
			}
		}
	}
	return [...values]
}

/**
 * Extract a flat, de-duplicated list of string values from a single claim per a {@link ClaimValueSource}:
 * resolves the (possibly nested) claim, normalises scalar/array, optionally filters + projects an
 * array of objects (`where` / `pick`), and optionally splits a delimited string (`split`). Non-scalar
 * leaves (objects, null/undefined) are skipped; finite numbers are coerced to their string form.
 */
export const extractClaimValues = (source: ClaimValueSource, claims: Record<string, unknown>): string[] => {
	const resolved = resolvePath(claims, source.claim)
	const items: unknown[] = Array.isArray(resolved) ? resolved : [resolved]
	const out: string[] = []
	for (const item of items) {
		let value: unknown = item
		if (source.where !== undefined || source.pick !== undefined) {
			if (!isRecord(item)) {
				continue
			}
			if (source.where && !scalarEquals(resolvePath(item, source.where.field), source.where.equals)) {
				continue
			}
			value = source.pick !== undefined ? resolvePath(item, source.pick) : undefined
		}
		if (typeof value === 'string' && source.split !== undefined) {
			for (const part of value.split(source.split)) {
				const trimmed = part.trim()
				if (trimmed.length > 0) {
					out.push(trimmed)
				}
			}
			continue
		}
		const scalar = coerceToString(value)
		if (scalar !== null) {
			out.push(scalar)
		}
	}
	return [...new Set(out)]
}

const resolvePath = (root: unknown, path: string): unknown => {
	let current: unknown = root
	for (const key of path.split('.')) {
		// Own-property only: never descend into inherited members, so a claim object can't surface
		// `Object.prototype` via a `__proto__` segment (and a configured path can't read a prototype member).
		if (!isRecord(current) || !Object.prototype.hasOwnProperty.call(current, key)) {
			return undefined
		}
		current = current[key]
	}
	return current
}

const coerceToString = (value: unknown): string | null => {
	if (typeof value === 'string') {
		return value
	}
	if (typeof value === 'number' && Number.isFinite(value)) {
		return String(value)
	}
	return null
}

const ruleMatches = (rule: ClaimMappingRule, claimValue: unknown): boolean => {
	if (rule.equals !== undefined) {
		return matchEquals(claimValue, rule.equals)
	}
	if (rule.contains !== undefined) {
		return matchContains(claimValue, rule.contains)
	}
	// No condition: match on mere PRESENCE of a non-empty value. Treated as absent: `undefined` / `null`
	// (claim not present), the boolean `false` (a `groups`-style flag only grants when truthy), an empty
	// array (e.g. `groups: []` — the user is in no group), and an empty string. "Presence" therefore means
	// the claim actually carries a value, not merely that the field exists but is empty.
	if (claimValue === undefined || claimValue === null || claimValue === false || claimValue === '') {
		return false
	}
	if (Array.isArray(claimValue)) {
		return claimValue.length > 0
	}
	return true
}

const matchEquals = (claimValue: unknown, expected: string | number | boolean | null): boolean => {
	if (Array.isArray(claimValue)) {
		return claimValue.some(it => scalarEquals(it, expected))
	}
	return scalarEquals(claimValue, expected)
}

const matchContains = (claimValue: unknown, needle: string | number | boolean | null): boolean => {
	// An empty-string needle would substring-match EVERY string claim (`s.includes('') === true`) — a
	// match-everyone grant to every user of the IdP. Config-time validation rejects it, but a config planted
	// out-of-band (a direct `identity_provider.configuration` JSONB edit) bypasses that guard; refuse it here
	// too so the evaluator never honours a degenerate match-everyone rule, regardless of how it arrived (SEC-1).
	if (needle === '') {
		return false
	}
	if (Array.isArray(claimValue)) {
		return claimValue.some(it => scalarEquals(it, needle))
	}
	if (typeof claimValue === 'string' && typeof needle === 'string') {
		return claimValue.includes(needle)
	}
	return scalarEquals(claimValue, needle)
}

const scalarEquals = (value: unknown, expected: string | number | boolean | null): boolean => {
	if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
		return value === expected
	}
	return false
}
