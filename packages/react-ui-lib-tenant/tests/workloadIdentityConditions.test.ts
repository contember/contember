import { describe, expect, it } from 'bun:test'
import { formatWorkloadCondition, formatWorkloadConditions } from '../src/config/workload-identity-conditions.js'

describe('formatWorkloadCondition', () => {
	it('renders each operator against a claim', () => {
		expect(formatWorkloadCondition({ claim: 'repository', equals: 'acme/app' })).toBe('repository = "acme/app"')
		expect(formatWorkloadCondition({ claim: 'repository_id', equals: 74 })).toBe('repository_id = 74')
		expect(formatWorkloadCondition({ claim: 'sub', in: ['a', 2] })).toBe('sub in ["a", 2]')
		expect(formatWorkloadCondition({ claim: 'ref', startsWith: 'refs/heads/' })).toBe('ref starts with "refs/heads/"')
		expect(formatWorkloadCondition({ claim: 'groups', arrayContains: 'deployers' })).toBe('groups contains "deployers"')
	})

	it('keeps a dotted claim name apart from a path', () => {
		expect(formatWorkloadCondition({ claim: 'kubernetes.io', equals: 'x' })).toBe('kubernetes.io = "x"')
		expect(formatWorkloadCondition({ path: ['kubernetes.io', 'namespace'], equals: 'ci' })).toBe('kubernetes.io › namespace = "ci"')
	})

	it('falls back to JSON for a shape it does not recognize', () => {
		expect(formatWorkloadCondition({ claim: 'sub', path: ['sub'], equals: 'x' })).toBe('{"claim":"sub","path":["sub"],"equals":"x"}')
		expect(formatWorkloadCondition({ claim: 'sub', equals: 'x', startsWith: 'y' })).toBe('{"claim":"sub","equals":"x","startsWith":"y"}')
		expect(formatWorkloadCondition({ claim: 'sub', contains: 'prod' })).toBe('{"claim":"sub","contains":"prod"}')
		expect(formatWorkloadCondition({ claim: 'sub', equals: { nested: true } })).toBe('{"claim":"sub","equals":{"nested":true}}')
		expect(formatWorkloadCondition('sub')).toBe('"sub"')
	})
})

describe('formatWorkloadConditions', () => {
	it('renders one line per condition, in order', () => {
		expect(formatWorkloadConditions([
			{ claim: 'sub', equals: 'a' },
			{ claim: 'aud', in: ['b'] },
		])).toEqual(['sub = "a"', 'aud in ["b"]'])
	})

	it('renders a non-list value as a single JSON line', () => {
		expect(formatWorkloadConditions({ claim: 'sub' })).toEqual(['{"claim":"sub"}'])
	})
})
