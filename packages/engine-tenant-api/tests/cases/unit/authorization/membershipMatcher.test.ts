import { expect, test } from 'bun:test'
import { testUuid } from '../../../src/testUuid'
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

	expect(matcher.matches(createMembership('editor', siteIdA))).toBeTrue()
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

	expect(matcher.matches(createMembership('editor', siteIdB))).toBeFalse()
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
	expect(matcher.matches(createMembership('editor', siteIdB))).toBeFalse()
})

test('editor cannot assign editor role', async () => {
	const matcher = new MembershipMatcher([
		{
			...createMembership('editor', siteIdA),
			matchRule: {},
		},
	])
	expect(matcher.matches(createMembership('editor', siteIdB))).toBeFalse()
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
	expect(matcher.matches(createMembership('editor', siteIdB))).toBeTrue()
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
	expect(matcher.matches(createMembership('editor', siteIdA))).toBeFalse()
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
	expect(matcher.matches(createMembership('editor'))).toBeTrue()
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
	expect(matcher.matches(createMembership('editor', siteIdB))).toBeTrue()
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
	expect(matcher.matches({ role: 'editor', variables: [{ name: 'site', values: [siteIdA] }, { name: 'locale', values: ['XXX'] }] })).toBeFalse()
})
