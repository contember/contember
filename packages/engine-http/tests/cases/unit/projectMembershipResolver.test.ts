import { describe, expect, it } from 'vitest'
import { ProjectMembershipFetcher, ProjectMembershipResolver } from '../../../src/index.js'
import { createMock } from '../../utils.js'
import { Membership } from '@contember/engine-tenant-api'

describe('membership resolver', () => {
	it('should return implicit role', async () => {
		const membershipResolver = new ProjectMembershipResolver(false, createMock<ProjectMembershipFetcher>({
			fetchMemberships(): Promise<readonly Membership[]> {
				return Promise.resolve([])
			},
		}))
		const resolvedMembership = await membershipResolver.resolveMemberships({
			request: {
				get: () => '',
			},
			projectSlug: 'test',
			identity: {
				id: 'd4141336-6512-41ef-a25a-374de35a2806',
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
		expect(resolvedMembership).deep.eq([{ role: 'test', variables: [] }])
	})


	it('should return fetched memberships', async () => {
		const membershipResolver = new ProjectMembershipResolver(false, createMock<ProjectMembershipFetcher>({
			fetchMemberships(): Promise<readonly Membership[]> {
				return Promise.resolve([{ role: 'test', variables: [] }])
			},
		}))
		const resolvedMembership = await membershipResolver.resolveMemberships({
			request: {
				get: () => '',
			},
			projectSlug: 'test',
			identity: {
				id: 'd4141336-6512-41ef-a25a-374de35a2806',
				roles: [],
			},
			acl: {
				roles: {},
			},
		})
		expect(resolvedMembership).deep.eq([{ role: 'test', variables: [] }])
	})

	it('should return assumed membership', async () => {
		const membershipResolver = new ProjectMembershipResolver(false, createMock<ProjectMembershipFetcher>({
			fetchMemberships(): Promise<readonly Membership[]> {
				return Promise.resolve([{ role: 'admin', variables: [] }])
			},
		}))
		const resolvedMembership = await membershipResolver.resolveMemberships({
			request: {
				get: () => JSON.stringify({
					memberships: [{ role: 'test', variables: [{ name: 'lang', values: ['cs'] }] }],
				}),
			},
			projectSlug: 'test',
			identity: {
				id: 'd4141336-6512-41ef-a25a-374de35a2806',
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
				},
			},
		})
		expect(resolvedMembership).deep.eq([{ role: 'test', variables: [{ name: 'lang', values: ['cs'] }] }])
	})

})
