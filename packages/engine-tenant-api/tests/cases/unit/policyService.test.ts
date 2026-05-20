import { describe, expect, test } from 'bun:test'
import { PolicyValidationError, validateAssignmentTags, validatePolicyDocument, validatePolicySlug } from '../../../src/model/policy'

describe('slug validation', () => {
	test('accepts simple slugs', () => {
		expect(() => validatePolicySlug('auditor')).not.toThrow()
		expect(() => validatePolicySlug('billing-admin')).not.toThrow()
		expect(() => validatePolicySlug('team_eng.viewer')).not.toThrow()
		expect(() => validatePolicySlug('a')).not.toThrow()
	})

	test('rejects empty / bad chars', () => {
		expect(() => validatePolicySlug('')).toThrow(PolicyValidationError)
		expect(() => validatePolicySlug('-leading-dash')).toThrow(PolicyValidationError)
		expect(() => validatePolicySlug('contains space')).toThrow(PolicyValidationError)
		expect(() => validatePolicySlug('contains/slash')).toThrow(PolicyValidationError)
	})

	test('rejects builtin: prefix', () => {
		expect(() => validatePolicySlug('builtin:foo')).toThrow(PolicyValidationError)
	})

	test('rejects over 128 chars', () => {
		expect(() => validatePolicySlug('a'.repeat(129))).toThrow(PolicyValidationError)
	})
})

describe('document validation', () => {
	test('accepts minimal valid', () => {
		expect(() =>
			validatePolicyDocument({
				statements: [{ effect: 'allow', actions: ['tenant:project.view'], resources: ['*'] }],
			})
		).not.toThrow()
	})

	test('accepts empty statements', () => {
		expect(() => validatePolicyDocument({ statements: [] })).not.toThrow()
	})

	test('rejects non-array statements', () => {
		expect(() => validatePolicyDocument({ statements: 'oops' as any })).toThrow(PolicyValidationError)
	})

	test('rejects invalid effect', () => {
		expect(() =>
			validatePolicyDocument({
				statements: [{ effect: 'maybe' as any, actions: ['x'] }],
			})
		).toThrow(/effect/)
	})

	test('rejects empty actions', () => {
		expect(() =>
			validatePolicyDocument({
				statements: [{ effect: 'allow', actions: [] }],
			})
		).toThrow(/non-empty/)
	})

	test('rejects non-string action', () => {
		expect(() =>
			validatePolicyDocument({
				statements: [{ effect: 'allow', actions: [42 as any] }],
			})
		).toThrow(/non-empty string/)
	})

	test('rejects non-array resources', () => {
		expect(() =>
			validatePolicyDocument({
				statements: [{ effect: 'allow', actions: ['x'], resources: '*' as any }],
			})
		).toThrow(/array/)
	})

	test('accepts conditions with valid shape', () => {
		expect(() =>
			validatePolicyDocument({
				statements: [{
					effect: 'allow',
					actions: ['x'],
					conditions: {
						stringEquals: { 'subject.team': 'eng' },
						'forAnyValue:stringEquals': { 'subject.roles': ['admin', 'editor'] },
					},
				}],
			})
		).not.toThrow()
	})

	test('rejects unknown operator', () => {
		expect(() =>
			validatePolicyDocument({
				statements: [{ effect: 'allow', actions: ['x'], conditions: { stringEqual: { 'subject.team': 'eng' } } as any }],
			})
		).toThrow(/unknown operator/)
	})

	test('rejects non-object conditions', () => {
		expect(() =>
			validatePolicyDocument({
				statements: [{ effect: 'allow', actions: ['x'], conditions: 'nope' as any }],
			})
		).toThrow(/object/)
	})

	test('rejects array as conditions', () => {
		expect(() =>
			validatePolicyDocument({
				statements: [{ effect: 'allow', actions: ['x'], conditions: [] as any }],
			})
		).toThrow(/object/)
	})

	test('rejects non-object operator block', () => {
		expect(() =>
			validatePolicyDocument({
				statements: [{ effect: 'allow', actions: ['x'], conditions: { stringEquals: 'oops' } as any }],
			})
		).toThrow(/path/)
	})

	test('rejects non-primitive condition leaf', () => {
		expect(() =>
			validatePolicyDocument({
				statements: [{
					effect: 'allow',
					actions: ['x'],
					conditions: { stringEquals: { 'subject.team': { nested: 'x' } } } as any,
				}],
			})
		).toThrow(/primitive/)
	})
})

describe('assignment tags validation', () => {
	test('accepts primitives and arrays', () => {
		expect(() =>
			validateAssignmentTags({
				team: 'eng',
				level: 3,
				active: true,
				flags: ['a', 'b'],
				note: null,
			})
		).not.toThrow()
	})

	test('rejects non-object', () => {
		expect(() => validateAssignmentTags('oops' as any)).toThrow(/object/)
		expect(() => validateAssignmentTags([] as any)).toThrow(/object/)
	})

	test('rejects empty keys', () => {
		expect(() => validateAssignmentTags({ '': 'x' })).toThrow(/keys/)
	})

	test('rejects template syntax in string values', () => {
		expect(() => validateAssignmentTags({ team: '${identity.id}' })).toThrow(/template syntax/)
	})

	test('rejects template syntax inside array values', () => {
		expect(() => validateAssignmentTags({ teams: ['eng', '${injected}'] })).toThrow(/template syntax/)
	})

	test('rejects nested objects', () => {
		expect(() => validateAssignmentTags({ team: { nested: 'eng' } })).toThrow(/primitive/)
	})
})
