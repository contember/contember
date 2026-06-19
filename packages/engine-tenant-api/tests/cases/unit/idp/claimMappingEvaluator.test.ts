import { describe, expect, test } from 'bun:test'
import {
	ClaimMapping,
	evaluateClaimMapping,
	extractClaimValues,
	findClaimMappingShapeErrors,
	findRemovedRuleKeys,
	parseClaimMapping,
	resolveVariableValues,
} from '../../../../src/model/service/idp/index.js'

const mapping = (rules: ClaimMapping['rules'], extra: Partial<ClaimMapping> = {}): ClaimMapping => ({ rules, ...extra })

describe('evaluateClaimMapping', () => {
	test('contains matches an element of an array claim', () => {
		const result = evaluateClaimMapping(
			mapping([{ claim: 'groups', contains: 'IT-Admins', grantMembership: { project: 'demo', role: 'admin' } }]),
			{ groups: ['All-Staff', 'IT-Admins'] },
		)
		expect(result).toEqual([{ project: 'demo', role: 'admin', variables: [] }])
	})

	test('contains matches a substring of a string claim', () => {
		const result = evaluateClaimMapping(
			mapping([{ claim: 'department', contains: 'Edito', grantMembership: { project: 'demo', role: 'editor' } }]),
			{ department: 'Editorial' },
		)
		expect(result).toEqual([{ project: 'demo', role: 'editor', variables: [] }])
	})

	test('contains does not match when the value is absent', () => {
		const result = evaluateClaimMapping(
			mapping([{ claim: 'groups', contains: 'IT-Admins', grantMembership: { project: 'demo', role: 'admin' } }]),
			{ groups: ['All-Staff'] },
		)
		expect(result).toEqual([])
	})

	test('equals matches scalar and array claims', () => {
		expect(
			evaluateClaimMapping(mapping([{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } }]), {
				department: 'Editorial',
			}),
		).toEqual([{ project: 'demo', role: 'editor', variables: [] }])
		expect(
			evaluateClaimMapping(mapping([{ claim: 'roles', equals: 'admin', grantMembership: { project: 'demo', role: 'admin' } }]), {
				roles: ['user', 'admin'],
			}),
		).toEqual([{ project: 'demo', role: 'admin', variables: [] }])
		expect(
			evaluateClaimMapping(mapping([{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } }]), {
				department: 'Sales',
			}),
		).toEqual([])
	})

	test('a rule with no condition matches on mere presence (but not false)', () => {
		const rule = mapping([{ claim: 'mfa', grantMembership: { project: 'demo', role: 'editor' } }])
		expect(evaluateClaimMapping(rule, { mfa: true })).toEqual([{ project: 'demo', role: 'editor', variables: [] }])
		expect(evaluateClaimMapping(rule, { mfa: false })).toEqual([])
		expect(evaluateClaimMapping(rule, {})).toEqual([])
	})

	test('a presence rule does not match an empty array or empty string (only a non-empty value is "present")', () => {
		// An empty array (the user is in no group) and an empty string are "absent" for presence matching —
		// otherwise `groups: []` would grant to everyone whose IdP merely includes an (empty) groups claim.
		const groups = mapping([{ claim: 'groups', grantMembership: { project: 'demo', role: 'editor' } }])
		const dept = mapping([{ claim: 'dept', grantMembership: { project: 'demo', role: 'editor' } }])
		expect(evaluateClaimMapping(groups, { groups: [] })).toEqual([])
		expect(evaluateClaimMapping(dept, { dept: '' })).toEqual([])
		// a non-empty array / string still matches
		expect(evaluateClaimMapping(groups, { groups: ['x'] })).toEqual([{ project: 'demo', role: 'editor', variables: [] }])
		expect(evaluateClaimMapping(dept, { dept: 'x' })).toEqual([{ project: 'demo', role: 'editor', variables: [] }])
	})

	test('a rule whose claim names a prototype member (__proto__/constructor/toString) does NOT presence-match', () => {
		// Own-property only: a hostile/typo claim must not resolve to an always-present inherited member
		// (which is truthy) and thereby grant on every sign-in regardless of the IdP response.
		for (const claim of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
			expect(evaluateClaimMapping(mapping([{ claim, grantMembership: { project: 'demo', role: 'editor' } }]), {})).toEqual([])
		}
		// An own-property of the same name still matches normally.
		expect(
			evaluateClaimMapping(mapping([{ claim: 'constructor', grantMembership: { project: 'demo', role: 'editor' } }]), { constructor: 'x' }),
		).toEqual([{ project: 'demo', role: 'editor', variables: [] }])
	})

	test('grants memberships and dedupes by (project, role)', () => {
		const result = evaluateClaimMapping(
			mapping([
				{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } },
				{ claim: 'team', equals: 'news', grantMembership: { project: 'demo', role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] } },
			]),
			{ department: 'Editorial', team: 'news' },
		)
		expect(result).toEqual([{ project: 'demo', role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }])
	})

	test('resolves claim-derived membership variables through the mapping', () => {
		const result = evaluateClaimMapping(
			mapping([{
				claim: 'department',
				equals: 'Editorial',
				grantMembership: {
					project: 'demo',
					role: 'editor',
					variables: [{ name: 'locale', from: { claim: 'langs', split: ',' }, map: { cs: ['uuid-cs'], en: ['uuid-en'] } }],
				},
			}]),
			{ department: 'Editorial', langs: 'cs,en' },
		)
		expect(result).toEqual([{ project: 'demo', role: 'editor', variables: [{ name: 'locale', values: ['uuid-cs', 'uuid-en'] }] }])
	})

	test('unions membership variables across multiple rules granting the same (project, role)', () => {
		const result = evaluateClaimMapping(
			mapping([
				{ claim: 'a', equals: '1', grantMembership: { project: 'demo', role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] } },
				{
					claim: 'b',
					equals: '1',
					grantMembership: { project: 'demo', role: 'editor', variables: [{ name: 'locale', values: ['en'] }, { name: 'region', values: ['eu'] }] },
				},
			]),
			{ a: '1', b: '1' },
		)
		expect(result).toEqual([
			{ project: 'demo', role: 'editor', variables: [{ name: 'locale', values: ['cs', 'en'] }, { name: 'region', values: ['eu'] }] },
		])
	})

	test('unions duplicate variable names within a single grant', () => {
		const result = evaluateClaimMapping(
			mapping([{
				claim: 'department',
				equals: 'Editorial',
				grantMembership: { project: 'demo', role: 'editor', variables: [{ name: 'locale', values: ['en'] }, { name: 'locale', values: ['cs'] }] },
			}]),
			{ department: 'Editorial' },
		)
		// the two `locale` entries are unioned into one (sorted) entry, not emitted twice
		expect(result).toEqual([{ project: 'demo', role: 'editor', variables: [{ name: 'locale', values: ['cs', 'en'] }] }])
	})

	test('keeps (project, role) pairs distinct under a separator-colliding slug/role (JSON-encoded dedup key)', () => {
		// The dedup key JSON-encodes the (project, role) pair so a slug/role containing the separator can't
		// collide: a plain `${project}::${role}` would fold `a::b`/`c` and `a`/`b::c` into the same key and
		// drop one grant. They must stay two distinct memberships.
		const result = evaluateClaimMapping(
			mapping([
				{ claim: 'x', equals: '1', grantMembership: { project: 'a::b', role: 'c' } },
				{ claim: 'y', equals: '1', grantMembership: { project: 'a', role: 'b::c' } },
			]),
			{ x: '1', y: '1' },
		)
		expect(result).toEqual([
			{ project: 'a::b', role: 'c', variables: [] },
			{ project: 'a', role: 'b::c', variables: [] },
		])
	})
})

describe('extractClaimValues', () => {
	test('reads an array claim as its elements', () => {
		expect(extractClaimValues({ claim: 'languages' }, { languages: ['cs', 'en'] })).toEqual(['cs', 'en'])
	})

	test('reads a scalar claim as a single value and coerces finite numbers', () => {
		expect(extractClaimValues({ claim: 'lang' }, { lang: 'cs' })).toEqual(['cs'])
		expect(extractClaimValues({ claim: 'tenant' }, { tenant: 42 })).toEqual(['42'])
	})

	test('splits a delimited string claim, trimming and dropping empties', () => {
		expect(extractClaimValues({ claim: 'langs', split: ',' }, { langs: 'cs, en ,cs' })).toEqual(['cs', 'en'])
		expect(extractClaimValues({ claim: 'scope', split: ' ' }, { scope: 'cs en' })).toEqual(['cs', 'en'])
	})

	test('resolves a nested dot-path claim', () => {
		expect(extractClaimValues({ claim: 'profile.languages' }, { profile: { languages: ['cs'] } })).toEqual(['cs'])
		expect(extractClaimValues({ claim: 'profile.missing' }, { profile: {} })).toEqual([])
		expect(extractClaimValues({ claim: 'profile.deep' }, { profile: 'not-an-object' })).toEqual([])
	})

	test('filters and projects an array-of-objects claim', () => {
		const claims = { orgs: [{ code: 'cs', role: 'editor' }, { code: 'en', role: 'viewer' }, { code: 'de', role: 'editor' }] }
		expect(extractClaimValues({ claim: 'orgs', pick: 'code' }, claims)).toEqual(['cs', 'en', 'de'])
		expect(extractClaimValues({ claim: 'orgs', pick: 'code', where: { field: 'role', equals: 'editor' } }, claims)).toEqual(['cs', 'de'])
	})

	test('skips non-scalar leaves and missing claims, de-duplicates', () => {
		expect(extractClaimValues({ claim: 'missing' }, {})).toEqual([])
		expect(extractClaimValues({ claim: 'langs' }, { langs: ['cs', 'cs', { x: 1 }, null] })).toEqual(['cs'])
	})

	test('splits each string element of an array claim (split is not ignored for arrays)', () => {
		expect(extractClaimValues({ claim: 'langs', split: ',' }, { langs: ['cs,en', 'de'] })).toEqual(['cs', 'en', 'de'])
	})

	test('skips boolean and non-finite-number leaves', () => {
		expect(extractClaimValues({ claim: 'flag' }, { flag: true })).toEqual([])
		expect(extractClaimValues({ claim: 'n' }, { n: Infinity })).toEqual([])
		expect(extractClaimValues({ claim: 'n' }, { n: Number.NaN })).toEqual([])
	})

	test('where without pick matches the filter but projects no value', () => {
		expect(extractClaimValues({ claim: 'orgs', where: { field: 'role', equals: 'editor' } }, { orgs: [{ code: 'cs', role: 'editor' }] })).toEqual([])
	})

	test('never descends into inherited members (prototype-safe path resolution)', () => {
		expect(extractClaimValues({ claim: '__proto__' }, {})).toEqual([])
		expect(extractClaimValues({ claim: 'a.__proto__.polluted' }, { a: {} })).toEqual([])
	})
})

describe('resolveVariableValues', () => {
	test('keeps constant values as-is', () => {
		expect(resolveVariableValues({ name: 'locale', values: ['cs'] }, {})).toEqual(['cs'])
	})

	test('maps claim-derived raw values through a lookup table (cs,en -> uuids)', () => {
		expect(resolveVariableValues(
			{ name: 'locale', from: { claim: 'langs', split: ',' }, map: { cs: ['uuid-cs'], en: ['uuid-en'] } },
			{ langs: 'cs,en' },
		)).toEqual(['uuid-cs', 'uuid-en'])
	})

	test('drops unmapped raw values unless passthrough is set', () => {
		const variable = (passthrough?: boolean) => ({ name: 'locale', from: { claim: 'langs' }, map: { cs: ['uuid-cs'] }, passthrough })
		expect(resolveVariableValues(variable(), { langs: ['cs', 'de'] })).toEqual(['uuid-cs'])
		expect(resolveVariableValues(variable(true), { langs: ['cs', 'de'] })).toEqual(['uuid-cs', 'de'])
	})

	test('allow filters claim-derived values but never constants', () => {
		expect(resolveVariableValues(
			{ name: 'locale', values: ['base'], from: { claim: 'langs' }, passthrough: true, allow: ['cs'] },
			{ langs: ['cs', 'de'] },
		)).toEqual(['base', 'cs'])
	})

	test('allow filters mapped (non-passthrough) values too, and allow:[] drops all derived but keeps constants', () => {
		// allow applies to the mapped output, not the raw claim value
		expect(resolveVariableValues(
			{ name: 'locale', from: { claim: 'langs' }, map: { cs: ['uuid-cs'], en: ['uuid-en'] }, allow: ['uuid-cs'] },
			{ langs: ['cs', 'en'] },
		)).toEqual(['uuid-cs'])
		// allow:[] rejects every derived value while the constant survives
		expect(resolveVariableValues(
			{ name: 'locale', values: ['base'], from: { claim: 'langs' }, passthrough: true, allow: [] },
			{ langs: ['cs'] },
		)).toEqual(['base'])
	})

	test('a from that resolves to no values yields [] (constants are still kept)', () => {
		expect(resolveVariableValues({ name: 'locale', from: { claim: 'missing' }, map: { cs: ['uuid-cs'] } }, {})).toEqual([])
		expect(resolveVariableValues({ name: 'locale', values: ['base'], from: { claim: 'missing' } }, {})).toEqual(['base'])
	})

	test('a claim value naming a prototype member (__proto__/constructor/toString) is looked up safely without throwing', () => {
		const variable = (passthrough?: boolean) => ({ name: 'locale', from: { claim: 'langs' }, map: { cs: ['uuid-cs'] }, passthrough })
		const claims = { langs: ['__proto__', 'constructor', 'toString', 'cs'] }
		// Without passthrough the hostile keys are not own-properties of `map`, so they are dropped (no crash).
		expect(resolveVariableValues(variable(), claims)).toEqual(['uuid-cs'])
		// With passthrough they pass through verbatim as plain string values — still no crash.
		expect(resolveVariableValues(variable(true), claims)).toEqual(['__proto__', 'constructor', 'toString', 'uuid-cs'])
	})
})

describe('parseClaimMapping', () => {
	test('returns null when no mapping is configured', () => {
		expect(parseClaimMapping({})).toBeNull()
		expect(parseClaimMapping({ claimMapping: null })).toBeNull()
	})

	test('returns null for a claimMapping that carries no rules (OIDC identity-field remap coexists)', () => {
		// The OIDC provider stores identity-field remap under the same `claimMapping` key; A09 only acts
		// on `rules`, so a remap-only object is "no A09 mapping", not an error.
		expect(parseClaimMapping({ claimMapping: { email: 'mail', name: 'displayName', externalIdentifier: 'sub' } })).toBeNull()
		expect(parseClaimMapping({ claimMapping: 'not-an-object' })).toBeNull()
	})

	test('parses a valid mapping with defaults left unset, ignoring coexisting OIDC remap fields', () => {
		const parsed = parseClaimMapping({
			claimMapping: {
				email: 'mail',
				rules: [{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } }],
			},
		})
		expect(parsed?.rules).toHaveLength(1)
		expect(parsed?.syncPolicy).toBeUndefined()
		expect(parsed?.unmatched).toBeUndefined()
	})

	test('throws on a malformed mapping rather than silently dropping it', () => {
		expect(() => parseClaimMapping({ claimMapping: { rules: [{ contains: 'x' }] } })).toThrow()
	})

	test('rejects the removed grantRoles at parse time via noExtraProps (defense in depth against an out-of-band write)', () => {
		// Defense in depth: even a grantRoles config written out-of-band (bypassing config-time validation)
		// is now REJECTED by parse (noExtraProps), not silently stripped — so no global role is ever applied,
		// and on the sign-in path the whole mapping then fails open. The clearer, actionable rejection still
		// lives in findRemovedRuleKeys (see assertValidClaimMapping), exercised below.
		expect(() => parseClaimMapping({ claimMapping: { rules: [{ claim: 'groups', contains: 'IT', grantRoles: ['admin'] }] } })).toThrow()
	})

	test('parses claim-derived membership variables', () => {
		const parsed = parseClaimMapping({
			claimMapping: {
				rules: [{
					claim: 'department',
					equals: 'Editorial',
					grantMembership: {
						project: 'demo',
						role: 'editor',
						variables: [{
							name: 'locale',
							from: { claim: 'profile.langs', split: ',', pick: 'code', where: { field: 'role', equals: 'editor' } },
							map: { cs: ['uuid-cs'] },
							passthrough: false,
							allow: ['uuid-cs'],
						}],
					},
				}],
			},
		})
		expect(parsed?.rules[0].grantMembership?.variables?.[0].from?.claim).toBe('profile.langs')
	})
})

describe('findRemovedRuleKeys', () => {
	test('flags grantRoles still present on a rule', () => {
		expect(findRemovedRuleKeys({ claimMapping: { rules: [{ claim: 'groups', contains: 'IT', grantRoles: ['admin'] }] } })).toEqual(['grantRoles'])
	})

	test('returns empty for a membership-only mapping or no mapping', () => {
		expect(findRemovedRuleKeys({ claimMapping: { rules: [{ claim: 'dept', equals: 'Sales', grantMembership: { project: 'demo', role: 'admin' } }] } }))
			.toEqual([])
		expect(findRemovedRuleKeys({})).toEqual([])
		expect(findRemovedRuleKeys({ claimMapping: { email: 'mail' } })).toEqual([])
	})
})

describe('evaluateClaimMapping — non-string scalar matching', () => {
	test('equals matches non-string scalars strictly (number / boolean / null), the raw claim is not stringified', () => {
		// numeric equals matches the raw number; a STRING `equals` does NOT match a numeric claim (no coercion)
		expect(
			evaluateClaimMapping(mapping([{ claim: 'level', equals: 3, grantMembership: { project: 'demo', role: 'editor' } }]), { level: 3 }),
		)
			.toEqual([{ project: 'demo', role: 'editor', variables: [] }])
		expect(
			evaluateClaimMapping(mapping([{ claim: 'level', equals: '3', grantMembership: { project: 'demo', role: 'editor' } }]), { level: 3 }),
		)
			.toEqual([])
		// boolean equals
		expect(
			evaluateClaimMapping(mapping([{ claim: 'active', equals: true, grantMembership: { project: 'demo', role: 'editor' } }]), { active: true }),
		)
			.toEqual([{ project: 'demo', role: 'editor', variables: [] }])
		expect(
			evaluateClaimMapping(mapping([{ claim: 'active', equals: true, grantMembership: { project: 'demo', role: 'editor' } }]), { active: false }),
		)
			.toEqual([])
		// null equals matches an explicit null claim (distinct from the mere-presence path, which treats null as absent)
		expect(
			evaluateClaimMapping(mapping([{ claim: 'tier', equals: null, grantMembership: { project: 'demo', role: 'editor' } }]), { tier: null }),
		)
			.toEqual([{ project: 'demo', role: 'editor', variables: [] }])
	})

	test('contains matches a numeric element of an array claim', () => {
		expect(
			evaluateClaimMapping(mapping([{ claim: 'codes', contains: 7, grantMembership: { project: 'demo', role: 'editor' } }]), { codes: [1, 7, 9] }),
		)
			.toEqual([{ project: 'demo', role: 'editor', variables: [] }])
		expect(
			evaluateClaimMapping(mapping([{ claim: 'codes', contains: 7, grantMembership: { project: 'demo', role: 'editor' } }]), { codes: [1, 9] }),
		)
			.toEqual([])
	})

	test('SEC-1: an empty `contains` needle never matches (no match-everyone), even on an out-of-band config', () => {
		// Config-time validation rejects an empty `contains`, but a config planted out-of-band (a direct
		// `identity_provider.configuration` JSONB edit) bypasses it; the evaluator must still refuse it, since
		// `s.includes('')` is always true and would grant the membership to every IdP user.
		expect(
			evaluateClaimMapping(mapping([{ claim: 'department', contains: '', grantMembership: { project: 'demo', role: 'editor' } }]), {
				department: 'Editorial',
			}),
		)
			.toEqual([])
		expect(
			evaluateClaimMapping(mapping([{ claim: 'groups', contains: '', grantMembership: { project: 'demo', role: 'editor' } }]), { groups: ['anything'] }),
		)
			.toEqual([])
	})

	test('TEST-1: a rule that sets both equals and contains is evaluated by `equals` only (equals wins)', () => {
		// Config validation rejects a both-set rule, but the apply-time guard does not re-check shape, so a rule
		// planted out-of-band reaches the evaluator: pin that it honours `equals` and ignores `contains`.
		// equals matches, contains would not → granted (proves `equals` is honoured)
		expect(
			evaluateClaimMapping(
				mapping([{ claim: 'department', equals: 'Editorial', contains: 'Sales', grantMembership: { project: 'demo', role: 'editor' } }]),
				{ department: 'Editorial' },
			),
		)
			.toEqual([{ project: 'demo', role: 'editor', variables: [] }])
		// equals does NOT match, contains would → not granted (proves `contains` is ignored)
		expect(
			evaluateClaimMapping(
				mapping([{ claim: 'department', equals: 'Editorial', contains: 'Edit', grantMembership: { project: 'demo', role: 'editor' } }]),
				{ department: 'Editing' },
			),
		)
			.toEqual([])
	})
})

describe('extractClaimValues — prototype safety of where.field / pick', () => {
	test('a hostile where.field or pick dot-path resolves to undefined (no inherited member, no throw)', () => {
		const claims = { orgs: [{ code: 'cs', role: 'editor' }] }
		// where.field naming a prototype member → resolves undefined → no element matches the filter
		expect(extractClaimValues({ claim: 'orgs', pick: 'code', where: { field: '__proto__', equals: 'x' } }, claims)).toEqual([])
		// pick naming a prototype member → projects undefined → dropped
		expect(extractClaimValues({ claim: 'orgs', pick: '__proto__', where: { field: 'role', equals: 'editor' } }, claims)).toEqual([])
		expect(extractClaimValues({ claim: 'orgs', pick: 'constructor' }, claims)).toEqual([])
	})
})

describe('findClaimMappingShapeErrors', () => {
	test('CORR-3: flags a rule that sets both equals and contains', () => {
		expect(findClaimMappingShapeErrors(mapping([{ claim: 'x', equals: 'a', contains: 'b', grantMembership: { project: 'demo', role: 'editor' } }])))
			.toHaveLength(1)
	})

	test('CORR-3: a rule with only equals, only contains, or neither is fine', () => {
		expect(findClaimMappingShapeErrors(mapping([
			{ claim: 'x', equals: 'a', grantMembership: { project: 'demo', role: 'editor' } },
			{ claim: 'y', contains: 'b', grantMembership: { project: 'demo', role: 'editor' } },
			{ claim: 'z', grantMembership: { project: 'demo', role: 'editor' } },
		]))).toEqual([])
	})

	test('flags a rule with a genuinely omitted grantMembership — it matches but grants nothing', () => {
		// A grantMembership the configurer simply left out (no typo) is permitted by the `partial` schema, so
		// parse accepts it; the shape check is what turns this grants-nothing rule into a loud config error.
		expect(findClaimMappingShapeErrors(mapping([{ claim: 'groups', contains: 'IT' }]))).toHaveLength(1)
		// A MISSPELLED grantMembership key (e.g. grantMembershp) is no longer silently stripped: noExtraProps
		// rejects it at parse, so the typo surfaces as a parse error rather than a grants-nothing rule.
		expect(() =>
			parseClaimMapping({
				claimMapping: { rules: [{ claim: 'groups', contains: 'IT', grantMembershp: { project: 'demo', role: 'editor' } }] },
			})
		).toThrow()
	})

	test('SIMP-2: flags a variable using from.where without from.pick', () => {
		expect(findClaimMappingShapeErrors(mapping([{
			claim: 'x',
			equals: 'a',
			grantMembership: {
				project: 'demo',
				role: 'editor',
				variables: [{ name: 'language', from: { claim: 'orgs', where: { field: 'role', equals: 'editor' } } }],
			},
		}]))).toHaveLength(1)
	})

	test('SIMP-2: from.where WITH from.pick is fine, and from without where is fine', () => {
		expect(findClaimMappingShapeErrors(mapping([{
			claim: 'x',
			equals: 'a',
			grantMembership: {
				project: 'demo',
				role: 'editor',
				variables: [
					{ name: 'language', from: { claim: 'orgs', pick: 'code', where: { field: 'role', equals: 'editor' } } },
					{ name: 'language', from: { claim: 'langs', split: ',' } },
				],
			},
		}]))).toEqual([])
	})

	test('flags an empty `contains` (would substring-match every string claim → grant to everyone)', () => {
		expect(findClaimMappingShapeErrors(mapping([{ claim: 'email', contains: '', grantMembership: { project: 'demo', role: 'editor' } }])))
			.toHaveLength(1)
	})

	test('flags an empty / whitespace-only `equals`', () => {
		expect(findClaimMappingShapeErrors(mapping([{ claim: 'dept', equals: '', grantMembership: { project: 'demo', role: 'editor' } }])))
			.toHaveLength(1)
		expect(findClaimMappingShapeErrors(mapping([{ claim: 'dept', equals: '   ', grantMembership: { project: 'demo', role: 'editor' } }])))
			.toHaveLength(1)
	})

	test('flags an empty `from.split` delimiter (would explode a claim value into individual characters)', () => {
		expect(findClaimMappingShapeErrors(mapping([{
			claim: 'x',
			equals: 'a',
			grantMembership: {
				project: 'demo',
				role: 'editor',
				variables: [{ name: 'language', from: { claim: 'langs', split: '' } }],
			},
		}]))).toHaveLength(1)
		// a non-empty delimiter is fine
		expect(findClaimMappingShapeErrors(mapping([{
			claim: 'x',
			equals: 'a',
			grantMembership: {
				project: 'demo',
				role: 'editor',
				variables: [{ name: 'language', from: { claim: 'langs', split: ',' } }],
			},
		}]))).toEqual([])
	})

	test('a non-empty matcher, and a non-string scalar matcher, are fine', () => {
		expect(findClaimMappingShapeErrors(mapping([
			{ claim: 'a', contains: 'x', grantMembership: { project: 'demo', role: 'editor' } },
			{ claim: 'b', equals: 0, grantMembership: { project: 'demo', role: 'editor' } },
			{ claim: 'c', equals: false, grantMembership: { project: 'demo', role: 'editor' } },
		]))).toEqual([])
	})
})
