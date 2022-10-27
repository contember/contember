
import { describe, expect, it } from 'vitest'
import { ProjectMembershipFetcher, ProjectMembershipResolver } from '../../../src'
import { createMock } from '../../utils'
import { Acl } from '@contember/schema'

describe('membership resolver', () => {
	it('should return implicit role', async () => {
		const membershipResolver = new ProjectMembershipResolver(false, createMock<ProjectMembershipFetcher>({
			fetchMemberships(): Promise<readonly Acl.Membership[]> {
				return Promise.resolve([])
			},
		}))
		const resolvedMembership = await membershipResolver.resolveMemberships({
			getHeader: () => '',
			projectSlug: 'test',
			identity: {
				identityId: 'd4141336-6512-41ef-a25a-374de35a2806',
				roles: [],
			},
			acl: {
				roles: {
					test: {
						implicit: true,
						variables: {},
						entities: {},
					},
				},
			},
		})
		expect(resolvedMembership.effective).deep.eq([{ role: 'test', variables: [] }])
	})


	it('should return fetched memberships', async () => {
		const membershipResolver = new ProjectMembershipResolver(false, createMock<ProjectMembershipFetcher>({
			fetchMemberships(): Promise<readonly Acl.Membership[]> {
				return Promise.resolve([{ role: 'test', variables: [] }])
			},
		}))
		const resolvedMembership = await membershipResolver.resolveMemberships({
			getHeader: () => '',
			projectSlug: 'test',
			identity: {
				identityId: 'd4141336-6512-41ef-a25a-374de35a2806',
				roles: [],
			},
			acl: {
				roles: {
					test: {
						variables: {},
						entities: {},
					},
				},
			},
		})
		expect(resolvedMembership.effective).deep.eq([{ role: 'test', variables: [] }])
	})

	it('should return assumed membership', async () => {
		const membershipResolver = new ProjectMembershipResolver(false, createMock<ProjectMembershipFetcher>({
			fetchMemberships(): Promise<readonly Acl.Membership[]> {
				return Promise.resolve([{ role: 'admin', variables: [] }])
			},
		}))
		const resolvedMembership = await membershipResolver.resolveMemberships({
			getHeader: () => JSON.stringify({
				memberships: [{ role: 'test', variables: [{ name: 'lang', values: [JSON.stringify({ eq: 'cs' })] }] }],
			}),
			projectSlug: 'test',
			identity: {
				identityId: 'd4141336-6512-41ef-a25a-374de35a2806',
				roles: [],
			},
			acl: {
				roles: {
					admin: {
						variables: {},
						entities: {},
						content: {
							assumeMembership: {
								test: {
									variables: true,
								},
							},
						},
					},
					test: {
						variables: {
							lang: {
								type: Acl.VariableType.condition,
							},
						},
						entities: {},
					},
				},
			},
		})
		expect(resolvedMembership.effective).deep.eq([{ role: 'test', variables: [{ name: 'lang', condition: { eq: 'cs' } }] }])
	})

})
