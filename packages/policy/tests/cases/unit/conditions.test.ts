import { describe, expect, test } from 'bun:test'
import { defaultOperators, evaluateConditions, UnknownConditionOperatorError } from '../../../src'

const ctx = (context: Record<string, unknown>) => ({ context, operators: defaultOperators })

describe('stringEquals', () => {
	test('matches single value', () => {
		expect(evaluateConditions(
			{ stringEquals: { 'a.b': 'hello' } },
			ctx({ a: { b: 'hello' } }),
		)).toBe(true)

		expect(evaluateConditions(
			{ stringEquals: { 'a.b': 'hello' } },
			ctx({ a: { b: 'world' } }),
		)).toBe(false)
	})

	test('matches one-of for array expected', () => {
		expect(evaluateConditions(
			{ stringEquals: { 'role': ['admin', 'editor'] } },
			ctx({ role: 'editor' }),
		)).toBe(true)

		expect(evaluateConditions(
			{ stringEquals: { 'role': ['admin', 'editor'] } },
			ctx({ role: 'viewer' }),
		)).toBe(false)
	})

	test('substitutes placeholder in expected', () => {
		expect(evaluateConditions(
			{ stringEquals: { 'subject.team': '${identity.team}' } },
			ctx({ identity: { team: 'eng' }, subject: { team: 'eng' } }),
		)).toBe(true)

		expect(evaluateConditions(
			{ stringEquals: { 'subject.team': '${identity.team}' } },
			ctx({ identity: { team: 'eng' }, subject: { team: 'ops' } }),
		)).toBe(false)
	})

	test('fails when actual is undefined', () => {
		expect(evaluateConditions(
			{ stringEquals: { 'missing': 'x' } },
			ctx({}),
		)).toBe(false)
	})

	test('case-sensitive by default, ignore-case alternate', () => {
		expect(evaluateConditions({ stringEquals: { x: 'ABC' } }, ctx({ x: 'abc' }))).toBe(false)
		expect(evaluateConditions({ stringEqualsIgnoreCase: { x: 'ABC' } }, ctx({ x: 'abc' }))).toBe(true)
	})
})

describe('stringLike', () => {
	test('glob match', () => {
		expect(evaluateConditions(
			{ stringLike: { 'arn': 'project:web*' } },
			ctx({ arn: 'project:webmaster' }),
		)).toBe(true)
	})

	test('not-like negates', () => {
		expect(evaluateConditions(
			{ stringNotLike: { 'arn': 'project:web*' } },
			ctx({ arn: 'project:other' }),
		)).toBe(true)
	})
})

describe('numeric', () => {
	test('lessThan / greaterThan / equals', () => {
		expect(evaluateConditions({ numericLessThan: { n: 10 } }, ctx({ n: 5 }))).toBe(true)
		expect(evaluateConditions({ numericLessThan: { n: 10 } }, ctx({ n: 10 }))).toBe(false)
		expect(evaluateConditions({ numericLessThanEquals: { n: 10 } }, ctx({ n: 10 }))).toBe(true)
		expect(evaluateConditions({ numericGreaterThan: { n: 10 } }, ctx({ n: 11 }))).toBe(true)
		expect(evaluateConditions({ numericEquals: { n: 10 } }, ctx({ n: 10 }))).toBe(true)
	})

	test('coerces string', () => {
		expect(evaluateConditions({ numericLessThan: { n: '10' } }, ctx({ n: '5' }))).toBe(true)
	})

	test('rejects non-numeric', () => {
		expect(evaluateConditions({ numericLessThan: { n: 10 } }, ctx({ n: 'abc' }))).toBe(false)
	})

	test('numericNotEquals: differs from every expected value (matches stringNotEquals semantics)', () => {
		// actual=1, expected=[1,2] — 1 IS in expected, so "not equals" is false
		expect(evaluateConditions({ numericNotEquals: { n: [1, 2] } }, ctx({ n: 1 }))).toBe(false)
		// actual=3, expected=[1,2] — 3 is in neither, so "not equals" is true
		expect(evaluateConditions({ numericNotEquals: { n: [1, 2] } }, ctx({ n: 3 }))).toBe(true)
	})

	test('numericNotEquals fails when actual is missing', () => {
		expect(evaluateConditions({ numericNotEquals: { n: 1 } }, ctx({}))).toBe(false)
	})
})

describe('negation operators on missing path', () => {
	test('stringNotEquals fails on missing path (fail-closed)', () => {
		expect(evaluateConditions({ stringNotEquals: { role: 'admin' } }, ctx({}))).toBe(false)
	})

	test('stringNotLike fails on missing path', () => {
		expect(evaluateConditions({ stringNotLike: { arn: 'project:*' } }, ctx({}))).toBe(false)
	})
})

describe('date', () => {
	test('compares ISO strings', () => {
		expect(evaluateConditions(
			{ dateLessThan: { 't': '2026-12-31' } },
			ctx({ t: '2026-05-18' }),
		)).toBe(true)

		expect(evaluateConditions(
			{ dateGreaterThan: { 't': '2026-12-31' } },
			ctx({ t: '2026-05-18' }),
		)).toBe(false)
	})

	test('Date instances', () => {
		const future = new Date('2030-01-01')
		expect(evaluateConditions(
			{ dateLessThan: { 't': future.toISOString() } },
			ctx({ t: new Date('2026-01-01') }),
		)).toBe(true)
	})
})

describe('bool', () => {
	test('true / false', () => {
		expect(evaluateConditions({ bool: { x: true } }, ctx({ x: true }))).toBe(true)
		expect(evaluateConditions({ bool: { x: true } }, ctx({ x: false }))).toBe(false)
		expect(evaluateConditions({ bool: { x: false } }, ctx({ x: false }))).toBe(true)
	})

	test('strings "true" / "false" coerce', () => {
		expect(evaluateConditions({ bool: { x: true } }, ctx({ x: 'true' }))).toBe(true)
		expect(evaluateConditions({ bool: { x: false } }, ctx({ x: 'false' }))).toBe(true)
		expect(evaluateConditions({ bool: { x: true } }, ctx({ x: 'false' }))).toBe(false)
	})

	test('non-bool actual is rejected, NOT coerced to false', () => {
		// Bug from earlier review: random strings, numbers, objects must NOT be
		// silently treated as `false` and pass `bool: { x: false }`.
		expect(evaluateConditions({ bool: { x: false } }, ctx({ x: 'no' }))).toBe(false)
		expect(evaluateConditions({ bool: { x: false } }, ctx({ x: 0 }))).toBe(false)
		expect(evaluateConditions({ bool: { x: false } }, ctx({ x: 1 }))).toBe(false)
		expect(evaluateConditions({ bool: { x: false } }, ctx({ x: '0' }))).toBe(false)
		expect(evaluateConditions({ bool: { x: false } }, ctx({ x: {} }))).toBe(false)
		expect(evaluateConditions({ bool: { x: true } }, ctx({ x: 'yes' }))).toBe(false)
	})

	test('missing path is fail-closed for allow effect', () => {
		// Under default effect ('allow'), missing path means condition doesn't hold.
		expect(evaluateConditions({ bool: { x: true } }, ctx({}))).toBe(false)
		expect(evaluateConditions({ bool: { x: false } }, ctx({}))).toBe(false)
	})

	test('missing path is fail-closed for deny effect (deny fires)', () => {
		expect(evaluateConditions({ bool: { x: true } }, ctx({}), 'deny')).toBe(true)
		expect(evaluateConditions({ bool: { x: false } }, ctx({}), 'deny')).toBe(true)
	})
})

describe('forAllValues:stringEquals', () => {
	test('every element in expected set', () => {
		expect(evaluateConditions(
			{ 'forAllValues:stringEquals': { tags: ['a', 'b', 'c'] } },
			ctx({ tags: ['a', 'b'] }),
		)).toBe(true)

		expect(evaluateConditions(
			{ 'forAllValues:stringEquals': { tags: ['a', 'b'] } },
			ctx({ tags: ['a', 'c'] }),
		)).toBe(false)
	})

	test('empty array passes', () => {
		expect(evaluateConditions(
			{ 'forAllValues:stringEquals': { tags: ['a'] } },
			ctx({ tags: [] }),
		)).toBe(true)
	})

	test('absent path passes (vacuous truth)', () => {
		expect(evaluateConditions(
			{ 'forAllValues:stringEquals': { tags: ['a'] } },
			ctx({}),
		)).toBe(true)
	})

	test('non-array, non-absent fails', () => {
		expect(evaluateConditions(
			{ 'forAllValues:stringEquals': { tags: ['a'] } },
			ctx({ tags: 'a' }),
		)).toBe(false)
	})
})

describe('forAllKeys:stringEquals', () => {
	test('every key in expected set', () => {
		expect(evaluateConditions(
			{ 'forAllKeys:stringEquals': { 'subject.variables': ['team', 'dept'] } },
			ctx({ subject: { variables: { team: ['eng'] } } }),
		)).toBe(true)

		expect(evaluateConditions(
			{ 'forAllKeys:stringEquals': { 'subject.variables': ['team'] } },
			ctx({ subject: { variables: { team: ['eng'], dept: ['x'] } } }),
		)).toBe(false)
	})

	test('empty object passes', () => {
		expect(evaluateConditions(
			{ 'forAllKeys:stringEquals': { 'subject.variables': ['team'] } },
			ctx({ subject: { variables: {} } }),
		)).toBe(true)
	})

	test('absent path passes (vacuous truth)', () => {
		expect(evaluateConditions(
			{ 'forAllKeys:stringEquals': { 'subject.variables': ['team'] } },
			ctx({ subject: {} }),
		)).toBe(true)
	})

	test('empty expected set rejects any key', () => {
		expect(evaluateConditions(
			{ 'forAllKeys:stringEquals': { 'subject.variables': [] } },
			ctx({ subject: { variables: { team: ['eng'] } } }),
		)).toBe(false)

		expect(evaluateConditions(
			{ 'forAllKeys:stringEquals': { 'subject.variables': [] } },
			ctx({ subject: { variables: {} } }),
		)).toBe(true)
	})

	test('array fails (must be plain object)', () => {
		expect(evaluateConditions(
			{ 'forAllKeys:stringEquals': { keys: ['a'] } },
			ctx({ keys: ['a', 'b'] }),
		)).toBe(false)
	})
})

describe('forAnyValue:stringEquals', () => {
	test('at least one matches', () => {
		expect(evaluateConditions(
			{ 'forAnyValue:stringEquals': { tags: ['x', 'y'] } },
			ctx({ tags: ['a', 'x'] }),
		)).toBe(true)

		expect(evaluateConditions(
			{ 'forAnyValue:stringEquals': { tags: ['x', 'y'] } },
			ctx({ tags: ['a', 'b'] }),
		)).toBe(false)
	})
})

describe('forAllValues:stringNotEquals', () => {
	test('every element outside the expected set', () => {
		expect(evaluateConditions(
			{ 'forAllValues:stringNotEquals': { tags: ['x', 'y'] } },
			ctx({ tags: ['a', 'b'] }),
		)).toBe(true)
	})

	test('any element inside the expected set fails', () => {
		expect(evaluateConditions(
			{ 'forAllValues:stringNotEquals': { tags: ['x', 'y'] } },
			ctx({ tags: ['a', 'x'] }),
		)).toBe(false)
	})

	test('empty / absent passes (vacuous)', () => {
		expect(evaluateConditions(
			{ 'forAllValues:stringNotEquals': { tags: ['x'] } },
			ctx({ tags: [] }),
		)).toBe(true)
		expect(evaluateConditions(
			{ 'forAllValues:stringNotEquals': { tags: ['x'] } },
			ctx({}),
		)).toBe(true)
	})

	test('non-array fails', () => {
		expect(evaluateConditions(
			{ 'forAllValues:stringNotEquals': { tags: ['x'] } },
			ctx({ tags: 'a' }),
		)).toBe(false)
	})
})

describe('forAnyValue:stringNotEquals', () => {
	test('at least one element outside the expected set', () => {
		expect(evaluateConditions(
			{ 'forAnyValue:stringNotEquals': { roles: ['login', 'project_admin'] } },
			ctx({ roles: ['login', 'random'] }),
		)).toBe(true)
	})

	test('all inside expected → false', () => {
		expect(evaluateConditions(
			{ 'forAnyValue:stringNotEquals': { roles: ['login', 'project_admin'] } },
			ctx({ roles: ['login', 'project_admin'] }),
		)).toBe(false)
	})

	test('empty array → false (no element to satisfy)', () => {
		expect(evaluateConditions(
			{ 'forAnyValue:stringNotEquals': { roles: ['login'] } },
			ctx({ roles: [] }),
		)).toBe(false)
	})

	test('missing path → fail-closed under deny', () => {
		expect(evaluateConditions(
			{ 'forAnyValue:stringNotEquals': { roles: ['login'] } },
			ctx({}),
			'deny',
		)).toBe(true)
	})

	test('missing path → false under allow (statement does not apply)', () => {
		expect(evaluateConditions(
			{ 'forAnyValue:stringNotEquals': { roles: ['login'] } },
			ctx({}),
			'allow',
		)).toBe(false)
	})
})

describe('exists', () => {
	test('must be defined', () => {
		expect(evaluateConditions({ exists: { x: true } }, ctx({ x: 'anything' }))).toBe(true)
		expect(evaluateConditions({ exists: { x: true } }, ctx({}))).toBe(false)
		expect(evaluateConditions({ exists: { x: false } }, ctx({}))).toBe(true)
	})
})

describe('multiple operators / paths', () => {
	test('all must pass — AND semantics', () => {
		expect(evaluateConditions(
			{
				stringEquals: { role: 'editor' },
				numericLessThan: { age: 100 },
			},
			ctx({ role: 'editor', age: 30 }),
		)).toBe(true)

		expect(evaluateConditions(
			{
				stringEquals: { role: 'editor' },
				numericLessThan: { age: 100 },
			},
			ctx({ role: 'admin', age: 30 }),
		)).toBe(false)
	})
})

describe('unresolved placeholder in expected value', () => {
	test('allow: unresolved ${...} → statement does not apply', () => {
		// invoker.team is not in context — expected stays as the literal `${invoker.team}`.
		// Without the unresolved-placeholder check, stringEquals would compare
		// 'eng' to the literal string and silently return false.
		expect(evaluateConditions(
			{ stringEquals: { 'subject.team': '${invoker.team}' } },
			ctx({ subject: { team: 'eng' } }),
			'allow',
		)).toBe(false)
	})

	test('deny: unresolved ${...} → fail-closed (deny fires)', () => {
		expect(evaluateConditions(
			{ stringEquals: { 'subject.team': '${invoker.team}' } },
			ctx({ subject: { team: 'eng' } }),
			'deny',
		)).toBe(true)
	})

	test('resolved placeholder behaves normally', () => {
		expect(evaluateConditions(
			{ stringEquals: { 'subject.team': '${invoker.team}' } },
			ctx({ subject: { team: 'eng' }, invoker: { team: 'eng' } }),
			'allow',
		)).toBe(true)
		expect(evaluateConditions(
			{ stringEquals: { 'subject.team': '${invoker.team}' } },
			ctx({ subject: { team: 'eng' }, invoker: { team: 'ops' } }),
			'allow',
		)).toBe(false)
	})

	test('array expected with one unresolved element propagates as missing', () => {
		// Mixed allowlist with one literal and one placeholder. If invoker.role is
		// absent, we can't know the full allowlist — treat as missing.
		expect(evaluateConditions(
			{ stringEquals: { 'subject.role': ['admin', '${invoker.role}'] } },
			ctx({ subject: { role: 'editor' } }),
			'deny',
		)).toBe(true)
		// With invoker.role present, comparison runs normally.
		expect(evaluateConditions(
			{ stringEquals: { 'subject.role': ['admin', '${invoker.role}'] } },
			ctx({ subject: { role: 'editor' }, invoker: { role: 'editor' } }),
			'deny',
		)).toBe(true) // operator returns true (editor matches)
	})
})

describe('errors', () => {
	test('unknown operator throws', () => {
		expect(() =>
			evaluateConditions(
				{ definitelyNotAnOperator: { x: 1 } },
				ctx({ x: 1 }),
			)
		).toThrow(UnknownConditionOperatorError)
	})
})

describe('no conditions', () => {
	test('undefined block passes', () => {
		expect(evaluateConditions(undefined, ctx({}))).toBe(true)
	})
})

describe('effect-aware missing-path handling', () => {
	test('allow + missing → false (statement does not apply)', () => {
		expect(evaluateConditions({ stringEquals: { x: 'a' } }, ctx({}), 'allow')).toBe(false)
		expect(evaluateConditions({ stringNotEquals: { x: 'a' } }, ctx({}), 'allow')).toBe(false)
		expect(evaluateConditions({ numericLessThan: { x: 1 } }, ctx({}), 'allow')).toBe(false)
		expect(evaluateConditions({ 'forAnyValue:stringEquals': { x: ['a'] } }, ctx({}), 'allow')).toBe(false)
	})

	test('deny + missing → true (deny fires fail-closed)', () => {
		expect(evaluateConditions({ stringEquals: { x: 'a' } }, ctx({}), 'deny')).toBe(true)
		expect(evaluateConditions({ stringNotEquals: { x: 'a' } }, ctx({}), 'deny')).toBe(true)
		expect(evaluateConditions({ numericLessThan: { x: 1 } }, ctx({}), 'deny')).toBe(true)
		expect(evaluateConditions({ 'forAnyValue:stringEquals': { x: ['a'] } }, ctx({}), 'deny')).toBe(true)
	})

	test('vacuous-truth operators still pass on missing under any effect', () => {
		// forAllValues / forAllKeys legitimately treat absent path as vacuous true
		// regardless of effect.
		expect(evaluateConditions({ 'forAllValues:stringEquals': { x: ['a'] } }, ctx({}), 'allow')).toBe(true)
		expect(evaluateConditions({ 'forAllValues:stringEquals': { x: ['a'] } }, ctx({}), 'deny')).toBe(true)
		expect(evaluateConditions({ 'forAllKeys:stringEquals': { x: ['a'] } }, ctx({}), 'allow')).toBe(true)
		expect(evaluateConditions({ 'forAllKeys:stringEquals': { x: ['a'] } }, ctx({}), 'deny')).toBe(true)
	})

	test('exists handles missing internally — not affected by effect', () => {
		// `exists: { x: false }` checks "x is missing" — semantics intrinsic to the operator.
		expect(evaluateConditions({ exists: { x: false } }, ctx({}), 'allow')).toBe(true)
		expect(evaluateConditions({ exists: { x: false } }, ctx({}), 'deny')).toBe(true)
		expect(evaluateConditions({ exists: { x: true } }, ctx({}), 'allow')).toBe(false)
		expect(evaluateConditions({ exists: { x: true } }, ctx({}), 'deny')).toBe(false)
	})

	test('definite false still rejects under both effects', () => {
		// `stringEquals` with present-but-wrong value: real false, NOT missing — engine must reject.
		expect(evaluateConditions({ stringEquals: { x: 'a' } }, ctx({ x: 'b' }), 'allow')).toBe(false)
		expect(evaluateConditions({ stringEquals: { x: 'a' } }, ctx({ x: 'b' }), 'deny')).toBe(false)
	})
})
