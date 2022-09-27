import { assert, test } from 'vitest'
import { MembershipResolver, MembershipValidationErrorType } from '../../../src'
import { Acl } from '@contember/schema'

const id1 = 'bff057b3-11f7-4bc7-abe3-1f2ef266824d'
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
	], MembershipResolver.UnknownIdentity)
	assert.lengthOf(result.errors, 0)
	assert.deepStrictEqual(result.memberships, [
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
	], MembershipResolver.UnknownIdentity)
	assert.deepStrictEqual(result.errors, [{
		error: MembershipValidationErrorType.VARIABLE_EMPTY,
		role: 'editor',
		variable: 'localeID',
	}])

	assert.deepStrictEqual(result.memberships, [
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
	})
	assert.lengthOf(result.errors, 0)
	assert.deepStrictEqual(result.memberships, [
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
	], MembershipResolver.UnknownIdentity)
	assert.lengthOf(result.errors, 0)
	assert.deepStrictEqual(result.memberships, [
		{ role: 'editor', variables: [{ name: 'cond', condition: { eq: 'foo' } }] },
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
	], MembershipResolver.UnknownIdentity)

	assert.deepStrictEqual(result.errors, [{
		error: MembershipValidationErrorType.VARIABLE_INVALID,
		role: 'editor',
		variable: 'cond',
	}])

	assert.deepStrictEqual(result.memberships, [
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
	})

	assert.deepStrictEqual(result.errors, [{
		error: MembershipValidationErrorType.ROLE_NOT_FOUND,
		role: 'editor',
		variable: undefined,
	}])

	assert.deepStrictEqual(result.memberships, [])
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
	], MembershipResolver.UnknownIdentity)

	assert.deepStrictEqual(result.errors, [{
		error: MembershipValidationErrorType.VARIABLE_NOT_FOUND,
		role: 'editor',
		variable: 'cond',
	}])

	assert.deepStrictEqual(result.memberships, [
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
	], MembershipResolver.UnknownIdentity)
	assert.deepStrictEqual(result.errors, [])

	assert.deepStrictEqual(result.memberships, [
		{ role: 'editor', variables: [{ name: 'localeID', condition: { always: true } }] },
	])
})
