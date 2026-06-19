import * as Typesafe from '@contember/typesafe'

/**
 * Provider-agnostic mapping of IdP claims/attributes to Contember project memberships (A09).
 * Stored on an IdP's `configuration.claimMapping`, so it rides inside the existing
 * `identity_provider.configuration` JSONB and needs no schema change — `addIDP` / `updateIDP`
 * already accept an opaque configuration object.
 *
 * The mapping grants **project memberships only** (a project role plus optional membership
 * variables). It deliberately does NOT grant global/tenant roles: those are privilege-bearing
 * and granting them from external claims would be a privilege-escalation path, so global-role
 * mapping was dropped. A project membership stays within what the IdP configurer
 * (`project_admin`, holding `IDP_ADD` / `IDP_UPDATE`) may already grant directly.
 *
 * Coexistence: the OIDC provider also uses `configuration.claimMapping` for an unrelated
 * identity-field remap (`email` / `name` / `externalIdentifier` / `attributesKey`). A09 only
 * looks at the `rules` field, so the two coexist in the same object — {@link parseClaimMapping}
 * returns `null` when no `rules` are present (an OIDC-only remap) instead of rejecting it.
 *
 * Each rule inspects one `claim` from the IdP response (the raw claims flow through verbatim,
 * since `IDPResponse` is `& Record<string, unknown>`) and, when it matches, grants a project
 * membership. Rules are independent and additive — every matching rule contributes; a
 * non-matching rule is simply skipped.
 *
 * Matching is declarative, never code:
 * - `equals`   — the claim equals the value (scalar compare; for array claims, the value is one
 *                of the elements).
 * - `contains` — the claim contains the value: substring for string claims, membership for array
 *                claims. This is the natural fit for multi-valued `groups`.
 * - neither    — the rule matches whenever the claim is merely present (and truthy for booleans).
 */
/**
 * Where a membership variable's values come from when they are not constant. Reads one `claim` as a
 * dot-path into the IdP response (so nested claims like `profile.languages` work) and shapes the raw
 * value(s) into a flat list of strings:
 * - array claim       → its elements (`languages: ['cs','en']`)
 * - `split`           → split a delimited string claim (`'cs,en'`, OIDC-style `'cs en'`) into elements
 * - `pick` / `where`  → for an array-of-objects claim, keep elements matching `where` and take their
 *                       `pick` field (`orgs: [{ code, role }]` → codes of the elements where role matches)
 *
 * The extracted raw values are then run through {@link ClaimMappingVariable}'s `map` / `passthrough`.
 */
export const ClaimValueSource = Typesafe.noExtraProps(Typesafe.intersection(
	Typesafe.object({
		/** Claim to read, as a dot-path into the IdP response (e.g. `profile.languages`). */
		claim: Typesafe.string,
	}),
	Typesafe.partial({
		/** Split each string value on this delimiter (e.g. `,` or ` `): a scalar string claim and every string element of an array claim. A no-op for non-string values. */
		split: Typesafe.string,
		/** For an array-of-objects claim, take this (dot-path) field from each element. */
		pick: Typesafe.string,
		/** For an array-of-objects claim, keep only elements whose `field` equals `equals`. */
		where: Typesafe.noExtraProps(Typesafe.object({
			field: Typesafe.string,
			equals: Typesafe.scalar,
		})),
	}),
))

export type ClaimValueSource = ReturnType<typeof ClaimValueSource>

/**
 * One membership variable to set on a granted membership. Either constant (`values`), claim-derived
 * (`from`), or both — the two sets are unioned. When derived from a claim:
 * - `map`         — lookup table from a raw claim value to the value(s) actually set, e.g.
 *                   `{ cs: ['<locale-uuid>'] }`. A raw value absent from the map is dropped…
 * - `passthrough` — …unless `passthrough` is `true`, in which case it is set verbatim. Off by
 *                   default: raw external claim values then flow straight into row-level ACL
 *                   variables, so enable it only when the variable legitimately holds claim values
 *                   (not opaque ids), and prefer `map` / `allow` to bound what an IdP can inject.
 * - `allow`       — optional allowlist applied to the claim-derived values (constants are never filtered).
 */
export const ClaimMappingVariable = Typesafe.noExtraProps(Typesafe.intersection(
	Typesafe.object({
		name: Typesafe.string,
	}),
	Typesafe.partial({
		/** Constant values, set regardless of any claim (the original static form). */
		values: Typesafe.array(Typesafe.string),
		/** Derive (additional) values from a claim. */
		from: ClaimValueSource,
		/** Lookup table applied to each raw value from `from`. A raw value with no entry is dropped unless `passthrough`. */
		map: Typesafe.record(Typesafe.string, Typesafe.array(Typesafe.string)),
		/** When `true`, a raw value from `from` not present in `map` is set verbatim. See the security note above. */
		passthrough: Typesafe.boolean,
		/** Allowlist applied to the values derived from `from` (constants in `values` are unaffected). */
		allow: Typesafe.array(Typesafe.string),
	}),
))

export type ClaimMappingVariable = ReturnType<typeof ClaimMappingVariable>

export const ClaimMappingMembership = Typesafe.noExtraProps(Typesafe.intersection(
	Typesafe.object({
		project: Typesafe.string,
		role: Typesafe.string,
	}),
	Typesafe.partial({
		/**
		 * Membership variables to set. Each is constant (`values`, e.g. `[{ name: 'locale', values: ['cs'] }]`)
		 * and/or claim-derived (`from`, e.g. map a `languages` claim through a lookup table to locale ids).
		 */
		variables: Typesafe.array(ClaimMappingVariable),
	}),
))

export type ClaimMappingMembership = ReturnType<typeof ClaimMappingMembership>

export const ClaimMappingRule = Typesafe.noExtraProps(Typesafe.intersection(
	Typesafe.object({
		/** Name of the claim/attribute from the IdP response to inspect. */
		claim: Typesafe.string,
	}),
	Typesafe.partial({
		/** Match when the claim equals this value (array claims: when it contains this element). */
		equals: Typesafe.scalar,
		/** Match when the claim contains this value (substring for strings, element for arrays). */
		contains: Typesafe.scalar,
		/** Project membership to grant when the rule matches. */
		grantMembership: ClaimMappingMembership,
	}),
))

export type ClaimMappingRule = ReturnType<typeof ClaimMappingRule>

/**
 * The validated A09 mapping. `rules` is required here — {@link parseClaimMapping} only returns a
 * mapping once it has confirmed `rules` is present, and returns `null` otherwise (so an OIDC-only
 * `claimMapping` is treated as "no role mapping", not an error).
 */
export const ClaimMapping = Typesafe.intersection(
	Typesafe.object({
		rules: Typesafe.array(ClaimMappingRule),
	}),
	Typesafe.partial({
		/**
		 * When to apply the mapping:
		 * - `always` (default) — re-sync memberships on every sign-in (and on every OIDC session refresh).
		 * - `sticky`           — apply only when the account is first created by auto-sign-up; existing
		 *                        accounts (including one being linked to this IdP for the first time) are
		 *                        left untouched.
		 */
		syncPolicy: Typesafe.enumeration('always', 'sticky'),
		/**
		 * How to treat existing grants the mapping does NOT (re)assign on this sign-in:
		 * - `keep`   (default, safer) — leave pre-existing memberships untouched.
		 * - `remove` — strip memberships that the mapping no longer grants (IdP becomes the source of
		 *              truth). Only ever touches grants the mapping itself could have made; memberships
		 *              outside the mapping's vocabulary are never removed.
		 */
		unmatched: Typesafe.enumeration('keep', 'remove'),
	}),
)

export type ClaimMapping = ReturnType<typeof ClaimMapping>

export const DEFAULT_SYNC_POLICY: NonNullable<ClaimMapping['syncPolicy']> = 'always'
export const DEFAULT_UNMATCHED: NonNullable<ClaimMapping['unmatched']> = 'keep'

export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Parse the optional A09 `claimMapping` out of an IdP `configuration` blob. Returns `null` when no
 * A09 mapping is present — either no `claimMapping` at all, or a `claimMapping` that carries no
 * `rules` (e.g. the OIDC identity-field remap, which shares this key). Returning `null` keeps both
 * the pre-A09 sign-in path and the OIDC remap untouched.
 *
 * Only the A09 fields (`rules`, `syncPolicy`, `unmatched`) are validated; any other keys on the
 * `claimMapping` object (the OIDC remap fields) are ignored, so the two features coexist. Throws via
 * Typesafe when `rules` is present but structurally malformed (e.g. a rule missing its required
 * `claim`), so an A09 misconfiguration surfaces loudly rather than silently dropping grants.
 *
 * The nested A09 schemas (rule / membership / variable / value-source) are wrapped in
 * `Typesafe.noExtraProps`, so a typo'd key on any of them (e.g. `grantMembershp`, `equls`) is
 * REJECTED, not silently stripped — a misconfiguration surfaces loudly instead of degrading into a
 * grants-nothing or match-everyone rule. The one exception is the top-level `claimMapping` object
 * itself: it is the key SHARED with the OIDC identity-remap (`email`/`name`/`externalIdentifier`/
 * `attributesKey`), so this parse first projects only the A09 fields (`rules`/`syncPolicy`/`unmatched`)
 * into a fresh object (above) and deliberately does NOT apply `noExtraProps` there — the OIDC remap
 * fields must coexist. The `map` lookup table is likewise a `record` (arbitrary keys are legitimate),
 * not a strict object. The removed `grantRoles` key is still caught separately by
 * {@link findRemovedRuleKeys} (run before this parse) for a clearer message than the generic
 * extra-property error `noExtraProps` would otherwise raise.
 */
export const parseClaimMapping = (configuration: Record<string, unknown>): ClaimMapping | null => {
	const raw = configuration.claimMapping
	if (!isRecord(raw) || raw.rules === undefined || raw.rules === null) {
		return null
	}
	const input: Record<string, unknown> = { rules: raw.rules }
	if (raw.syncPolicy !== undefined) {
		input.syncPolicy = raw.syncPolicy
	}
	if (raw.unmatched !== undefined) {
		input.unmatched = raw.unmatched
	}
	return ClaimMapping(input, ['claimMapping'])
}

/**
 * The set of A09 rule keys that were removed when global-role mapping was dropped. Detected
 * explicitly (rather than relying on Typesafe's generic "extra property" rejection) so a config
 * that still tries to grant global roles gets an actionable error.
 */
const REMOVED_RULE_KEYS = ['grantRoles'] as const

/**
 * Returns the removed rule keys (currently only `grantRoles`) still present in a raw `claimMapping`,
 * so config-time validation can reject them with a clear message pointing at `grantMembership`.
 */
export const findRemovedRuleKeys = (configuration: Record<string, unknown>): string[] => {
	const raw = configuration.claimMapping
	if (!isRecord(raw) || !Array.isArray(raw.rules)) {
		return []
	}
	const found = new Set<string>()
	for (const rule of raw.rules) {
		if (isRecord(rule)) {
			for (const key of REMOVED_RULE_KEYS) {
				if (key in rule) {
					found.add(key)
				}
			}
		}
	}
	return [...found]
}

/**
 * Semantic checks on a parsed mapping that the Typesafe shape cannot express. Returns one
 * human-readable message per problem (empty = ok); run at config time (IdP add/update) so a
 * contradictory rule is rejected loudly rather than silently mis-matching or granting nothing:
 * - a rule may use at most one of `equals` / `contains` ({@link ruleMatches} only ever honours `equals`
 *   when both are set, so the other would be silently ignored);
 * - a rule's `equals` / `contains` must not be an empty string: an empty `contains` substring-matches EVERY
 *   string claim (`'...'.includes('')` is always true), i.e. a match-everything grant to every user of the
 *   IdP, and an empty `equals` is an always-no-op footgun — to match on the claim's mere presence, omit both;
 * - a rule must carry a `grantMembership` — a rule with none matches but grants nothing. (A *misspelled*
 *   `grantMembership`, e.g. `grantMembershp`, is now rejected earlier by `noExtraProps` during
 *   {@link parseClaimMapping}; this check remains for a `grantMembership` that is genuinely OMITTED,
 *   which the `partial` schema permits.)
 * - a variable's `from.where` requires a `from.pick` — `where` filters elements but without `pick` there
 *   is nothing to project, so the source can only ever resolve to no values;
 * - a variable's `from.split` must not be the empty string — `''.split('')` explodes every claim value
 *   into its individual characters (the same class of footgun as an empty `equals` / `contains`).
 */
export const findClaimMappingShapeErrors = (mapping: ClaimMapping): string[] => {
	const errors: string[] = []
	for (const rule of mapping.rules) {
		if (rule.grantMembership === undefined) {
			errors.push(
				`claimMapping rule for claim '${rule.claim}' has no 'grantMembership', so it matches but grants nothing; add a 'grantMembership'`,
			)
		}
		if (rule.equals !== undefined && rule.contains !== undefined) {
			errors.push(`claimMapping rule for claim '${rule.claim}' sets both 'equals' and 'contains'; a rule may use at most one`)
		}
		if (typeof rule.equals === 'string' && rule.equals.trim() === '') {
			errors.push(
				`claimMapping rule for claim '${rule.claim}' has an empty 'equals' value; omit both 'equals' and 'contains' to match on the claim's mere presence, or set a non-empty value`,
			)
		}
		if (typeof rule.contains === 'string' && rule.contains.trim() === '') {
			errors.push(
				`claimMapping rule for claim '${rule.claim}' has an empty 'contains' value, which would substring-match every string value of the claim (a match-everything grant); omit both 'equals' and 'contains' to match on the claim's mere presence, or set a non-empty value`,
			)
		}
		for (const variable of rule.grantMembership?.variables ?? []) {
			if (variable.from?.where !== undefined && variable.from.pick === undefined) {
				errors.push(
					`claimMapping variable '${variable.name}' uses 'from.where' without 'from.pick'; it can only ever resolve to no values — set 'pick' (the field to take from each matched element)`,
				)
			}
			if (variable.from?.split === '') {
				errors.push(
					`claimMapping variable '${variable.name}' has an empty 'from.split' delimiter, which splits every claim value into its individual characters; omit 'split' to keep the value whole, or set a non-empty delimiter`,
				)
			}
		}
	}
	return errors
}
