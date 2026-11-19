import { describe, expect, test } from 'bun:test'
import { evaluateRoleCondition, type RoleCondition } from '../src/components/HasRole.js'

const roles = new Set(['admin', 'editor'])

describe('evaluateRoleCondition', () => {
	test('string matches a single role', () => {
		expect(evaluateRoleCondition('admin', roles)).toBe(true)
		expect(evaluateRoleCondition('guest', roles)).toBe(false)
	})

	test('array requires any of the roles', () => {
		expect(evaluateRoleCondition(['guest', 'editor'], roles)).toBe(true)
		expect(evaluateRoleCondition(['guest', 'banned'], roles)).toBe(false)
		expect(evaluateRoleCondition([], roles)).toBe(false)
	})

	test('accepts readonly arrays', () => {
		const editors = ['editor', 'lead'] as const
		expect(evaluateRoleCondition(editors, roles)).toBe(true)
		expect(evaluateRoleCondition({ all: editors }, roles)).toBe(false)
		expect(evaluateRoleCondition({ not: editors }, roles)).toBe(false)
	})

	test('any requires at least one of the roles', () => {
		expect(evaluateRoleCondition({ any: ['guest', 'admin'] }, roles)).toBe(true)
		expect(evaluateRoleCondition({ any: ['guest'] }, roles)).toBe(false)
		expect(evaluateRoleCondition({ any: [] }, roles)).toBe(false)
	})

	test('all requires every role', () => {
		expect(evaluateRoleCondition({ all: ['admin', 'editor'] }, roles)).toBe(true)
		expect(evaluateRoleCondition({ all: ['admin', 'guest'] }, roles)).toBe(false)
		expect(evaluateRoleCondition({ all: [] }, roles)).toBe(true)
	})

	test('not with a string excludes that role', () => {
		expect(evaluateRoleCondition({ not: 'guest' }, roles)).toBe(true)
		expect(evaluateRoleCondition({ not: 'admin' }, roles)).toBe(false)
	})

	test('not with an array excludes every listed role', () => {
		expect(evaluateRoleCondition({ not: ['guest', 'banned'] }, roles)).toBe(true)
		expect(evaluateRoleCondition({ not: ['guest', 'editor'] }, roles)).toBe(false)
	})

	test('function receives the role set', () => {
		expect(evaluateRoleCondition(it => it.has('admin') && it.size > 1, roles)).toBe(true)
		expect(evaluateRoleCondition(it => it.size > 2, roles)).toBe(false)
	})

	test('empty role set', () => {
		const none = new Set<string>()
		expect(evaluateRoleCondition('admin', none)).toBe(false)
		expect(evaluateRoleCondition({ not: 'admin' }, none)).toBe(true)
		expect(evaluateRoleCondition({ all: ['admin'] }, none)).toBe(false)
	})

	// Invalid shapes only reach the function from untyped input, so they come from JSON.parse here.
	test('throws on an object matching none of the keys', () => {
		const parsed: RoleCondition = JSON.parse('{"some": ["admin"]}')
		expect(() => evaluateRoleCondition(parsed, roles)).toThrow('Unsupported role condition: {"some":["admin"]}')
	})

	test('throws on an object with more than one key', () => {
		const parsed: RoleCondition = JSON.parse('{"any": ["admin"], "not": "admin"}')
		expect(() => evaluateRoleCondition(parsed, roles)).toThrow('Unsupported role condition')
	})

	test('throws on a not condition of an unsupported type', () => {
		const parsed: RoleCondition = JSON.parse('{"not": 1}')
		expect(() => evaluateRoleCondition(parsed, roles)).toThrow('Unsupported role condition: {"not":1}')
	})
})
