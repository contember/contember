import { assert, test } from 'vitest'
import { testUuid } from '@contember/engine-api-tester'
import { MembershipMatcher } from '../../../../src'

const siteIdA = testUuid(666)
const siteIdB = testUuid(667)

const createMembership = (role: string, site?: string) => (
	{ role, variables: site ? [{ name: 'site', values: [site] }] : [] }
)

test('admin can assign editor role with matching variable', async () => {
	const matcher = new MembershipMatcher([
		{
			...createMembership('admin', siteIdA),
			matchRule: {
				editor: {
					variables: { site: 'site' },
				},
			},
		},
	])

	assert.ok(matcher.matches(createMembership('editor', siteIdA)))
})

test('admin cannot assign editor role with matching variable, but in a different role', async () => {
	const matcher = new MembershipMatcher([
		{
			...createMembership('admin', siteIdA),
			matchRule: {
				editor: {
					variables: { site: 'site' },
				},
			},
		},
		{
			...createMembership('editor', siteIdB),
			matchRule: {},
		},
	])

	assert.notOk(matcher.matches(createMembership('editor', siteIdB)))
})

test('admin cannot assign editor role with different variable', async () => {
	const matcher = new MembershipMatcher([
		{
			...createMembership('admin', siteIdA),
			matchRule: {
				editor: {
					variables: { site: 'site' },
				},
			},
		},
	])
	assert.notOk(matcher.matches(createMembership('editor', siteIdB)))
})

test('editor cannot assign editor role', async () => {
	const matcher = new MembershipMatcher([
		{
			...createMembership('editor', siteIdA),
			matchRule: {},
		},
	])
	assert.notOk(matcher.matches(createMembership('editor', siteIdB)))
})

test('admin can assign editor role with any variable', async () => {
	const matcher = new MembershipMatcher([
		{
			...createMembership('admin', siteIdA),
			matchRule: {
				editor: {
					variables: true,
				},
			},
		},
	])
	assert.ok(matcher.matches(createMembership('editor', siteIdB)))
})

test('admin cannot assign editor role with any variable', async () => {
	const matcher = new MembershipMatcher([
		{
			...createMembership('admin', siteIdA),
			matchRule: {
				editor: {},
			},
		},
	])
	assert.notOk(matcher.matches(createMembership('editor', siteIdA)))
})

test('admin can assign editor role without variable', async () => {
	const matcher = new MembershipMatcher([
		{
			...createMembership('admin', siteIdA),
			matchRule: {
				editor: {},
			},
		},
	])
	assert.ok(matcher.matches(createMembership('editor')))
})

test('admin can assign editor role with any variable', async () => {
	const matcher = new MembershipMatcher([
		{
			...createMembership('admin', siteIdA),
			matchRule: {
				editor: {
					variables: { site: true },
				},
			},
		},
	])
	assert.ok(matcher.matches(createMembership('editor', siteIdB)))
})

test('admin cannot assign editor role if only one variable matches', async () => {
	const matcher = new MembershipMatcher([
		{
			...createMembership('admin', siteIdA),
			matchRule: {
				editor: {
					variables: {
						site: true,
					},
				},
			},
		},
	])
	assert.notOk(matcher.matches({ role: 'editor', variables: [{ name: 'site', values: [siteIdA] }, { name: 'locale', values: ['XXX'] }] }))
})
