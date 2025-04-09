import { expect, test } from 'bun:test'
import { MembershipResolver, MembershipValidationErrorType } from '../../../src'
import { Acl } from '@contember/schema'

const id1 = 'bff057b3-11f7-4bc7-abe3-1f2ef266824d'
const id2 = '1cdb828f-62f0-4ae5-9b2c-e53b3e7584ef'
test('read membership with entity variable', () => {
	const reader = new MembershipResolver()
	const result = reader.resolve({
		roles: {
			editor: {
				variables: {
					localeID: { type: Acl.VariableType.entity, entityName: 'Locale' },
				},
				entities: {},
			},
		},
	}, [
		{ role: 'editor', variables: [{ name: 'localeID', values: [id1] }] },
	], MembershipResolver.UnknownIdentity, false)
	expect(result.errors).toStrictEqual([])
	expect(result.memberships).toStrictEqual([
		{ role: 'editor', variables: [{ name: 'localeID', condition: { in: [id1] } }] },
	])
})

test('read fails when variable is not provided', () => {
	const reader = new MembershipResolver()
	const result = reader.resolve({
		roles: {
			editor: {
				variables: {
					localeID: { type: Acl.VariableType.entity, entityName: 'Locale' },
				},
				entities: {},
			},
		},
	}, [
		{ role: 'editor', variables: [] },
	], MembershipResolver.UnknownIdentity, false)
	expect(result.errors).toEqual([{
		error: MembershipValidationErrorType.VARIABLE_EMPTY,
		role: 'editor',
		variable: 'localeID',
	}])

	expect(result.memberships).toStrictEqual([
		{ role: 'editor', variables: [{ name: 'localeID', condition: { never: true } }] },
	])
})

test('read membership with predefined variable', () => {
	const reader = new MembershipResolver()
	const result = reader.resolve({
		roles: {
			editor: {
				variables: {
					self: { type: Acl.VariableType.predefined, value: 'identityID' },
				},
				entities: {},
			},
		},
	}, [
		{ role: 'editor', variables: [] },
	], {
		identityId: id1,
	}, false)
	expect(result.errors).toStrictEqual([])
	expect(result.memberships).toStrictEqual([
		{ role: 'editor', variables: [{ name: 'self', condition: { in: [id1] } }] },
	])
})

test('read membership with condition variable', () => {
	const reader = new MembershipResolver()
	const result = reader.resolve({
		roles: {
			editor: {
				variables: {
					cond: { type: Acl.VariableType.condition },
				},
				entities: {},
			},
		},
	}, [
		{ role: 'editor', variables: [{ name: 'cond', values: [JSON.stringify({ eq: 'foo' })] }] },
	], MembershipResolver.UnknownIdentity, false)
	expect(result.errors).toStrictEqual([])
	expect(result.memberships).toStrictEqual([
		{ role: 'editor', variables: [{ name: 'cond', condition: { eq: 'foo' } }] },
	])
})

test('fails when trying to override predefined variable with stored', () => {
	const reader = new MembershipResolver()
	const result = reader.resolve({
		roles: {
			editor: {
				variables: {
					self: { type: Acl.VariableType.predefined, value: 'identityID' },
				},
				entities: {},
			},
		},
	}, [
		{
			role: 'editor', variables: [
				{ name: 'self', values: [id2] },
			],
		},
	], {
		identityId: id1,
	}, false)
	expect(result.errors).toEqual([{
		error: MembershipValidationErrorType.VARIABLE_NOT_FOUND,
		role: 'editor',
		variable: 'self',
	}])
	expect(result.memberships).toStrictEqual([
		{ role: 'editor', variables: [{ name: 'self', condition: { in: [id1] } }] },
	])
})


test('read overridden predefined variable with assume', () => {
	const reader = new MembershipResolver()
	const result = reader.resolve({
		roles: {
			editor: {
				variables: {
					self: { type: Acl.VariableType.predefined, value: 'identityID' },
				},
				entities: {},
			},
		},
	}, [
		{
			role: 'editor', variables: [
				{ name: 'self', values: [id2] },
			],
		},
	], {
		identityId: id1,
	}, true)
	expect(result.errors).toEqual([])
	expect(result.memberships).toStrictEqual([
		{ role: 'editor', variables: [{ name: 'self', condition: { in: [id2] } }] },
	])
})


test('fails on invalid condition', () => {
	const reader = new MembershipResolver()
	const result = reader.resolve({
		roles: {
			editor: {
				variables: {
					cond: { type: Acl.VariableType.condition },
				},
				entities: {},
			},
		},
	}, [
		{ role: 'editor', variables: [{ name: 'cond', values: [JSON.stringify('abcd')] }] },
	], MembershipResolver.UnknownIdentity, false)

	expect(result.errors).toEqual([{
		error: MembershipValidationErrorType.VARIABLE_INVALID,
		role: 'editor',
		variable: 'cond',
	}])

	expect(result.memberships).toStrictEqual([
		{ role: 'editor', variables: [{ name: 'cond', condition: { never: true } }] },
	])
})

test('fails on undefined role', () => {
	const reader = new MembershipResolver()
	const result = reader.resolve({
		roles: {
		},
	}, [
		{ role: 'editor', variables: [{ name: 'cond', values: [JSON.stringify('abcd')] }] },
	], {
		identityId: id1,
	}, false)

	expect(result.errors).toEqual([{
		error: MembershipValidationErrorType.ROLE_NOT_FOUND,
		role: 'editor',
		variable: undefined,
	}])

	expect(result.memberships).toStrictEqual([])
})

test('fails on undefined variable', () => {
	const reader = new MembershipResolver()
	const result = reader.resolve({
		roles: {
			editor: {
				variables: {},
				entities: {},
			},
		},
	}, [
		{ role: 'editor', variables: [{ name: 'cond', values: [JSON.stringify('abcd')] }] },
	], MembershipResolver.UnknownIdentity, false)

	expect(result.errors).toEqual([{
		error: MembershipValidationErrorType.VARIABLE_NOT_FOUND,
		role: 'editor',
		variable: 'cond',
	}])

	expect(result.memberships).toStrictEqual([
		{ role: 'editor', variables: [] },
	])
})


test('use fallback value', () => {
	const reader = new MembershipResolver()
	const result = reader.resolve({
		roles: {
			editor: {
				variables: {
					localeID: { type: Acl.VariableType.condition, fallback: { always: true } },
				},
				entities: {},
			},
		},
	}, [
		{ role: 'editor', variables: [] },
	], MembershipResolver.UnknownIdentity, false)
	expect(result.errors).toStrictEqual([])

	expect(result.memberships).toStrictEqual([
		{ role: 'editor', variables: [{ name: 'localeID', condition: { always: true } }] },
	])
})
