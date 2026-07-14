import { describe, expect, it } from 'bun:test'
import { ProjectMembershipFetcher, ProjectMembershipResolver } from '../../../src/index.js'
import { createMock } from '../../utils.js'
import { Acl } from '@contember/schema'

describe('membership resolver', () => {
	it('should return implicit role', async () => {
		const membershipResolver = new ProjectMembershipResolver(
			false,
			createMock<ProjectMembershipFetcher>({
				fetchMemberships(): Promise<readonly Acl.Membership[]> {
					return Promise.resolve([])
				},
			}),
		)
		const resolvedMembership = await membershipResolver.resolveMemberships({
			request: {
				body: {},
				get: () => '',
			},
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
		expect(resolvedMembership.effective).toStrictEqual([{ role: 'test', variables: [] }])
	})

	it('should resolve predefined identity and person variables for an implicit role', async () => {
		const membershipResolver = new ProjectMembershipResolver(
			false,
			createMock<ProjectMembershipFetcher>({
				fetchMemberships(): Promise<readonly Acl.Membership[]> {
					return Promise.resolve([])
				},
			}),
		)
		const resolvedMembership = await membershipResolver.resolveMemberships({
			request: {
				body: {},
				get: () => '',
			},
			projectSlug: 'test',
			identity: {
				identityId: 'd4141336-6512-41ef-a25a-374de35a2806',
				personId: '4f1ac9f9-b647-4524-87d7-82c9a820fd87',
				roles: [],
			},
			acl: {
				roles: {
					test: {
						implicit: true,
						variables: {
							identity: { type: Acl.VariableType.predefined, value: 'identityID' },
							person: { type: Acl.VariableType.predefined, value: 'personID' },
						},
						entities: {},
					},
				},
			},
		})
		expect(resolvedMembership.effective).toStrictEqual([{
			role: 'test',
			variables: [
				{ name: 'identity', condition: { in: ['d4141336-6512-41ef-a25a-374de35a2806'] } },
				{ name: 'person', condition: { in: ['4f1ac9f9-b647-4524-87d7-82c9a820fd87'] } },
			],
		}])
	})

	it('should use a predefined person fallback for an implicit role without a person', async () => {
		const membershipResolver = new ProjectMembershipResolver(
			false,
			createMock<ProjectMembershipFetcher>({
				fetchMemberships(): Promise<readonly Acl.Membership[]> {
					return Promise.resolve([])
				},
			}),
		)
		const resolvedMembership = await membershipResolver.resolveMemberships({
			request: {
				body: {},
				get: () => '',
			},
			projectSlug: 'test',
			identity: {
				identityId: 'd4141336-6512-41ef-a25a-374de35a2806',
				roles: [],
			},
			acl: {
				roles: {
					test: {
						implicit: true,
						variables: {
							person: {
								type: Acl.VariableType.predefined,
								value: 'personID',
								fallback: { always: true },
							},
						},
						entities: {},
					},
				},
			},
		})
		expect(resolvedMembership.effective).toStrictEqual([{
			role: 'test',
			variables: [{ name: 'person', condition: { always: true } }],
		}])
	})

	it('should return fetched memberships', async () => {
		const membershipResolver = new ProjectMembershipResolver(
			false,
			createMock<ProjectMembershipFetcher>({
				fetchMemberships(): Promise<readonly Acl.Membership[]> {
					return Promise.resolve([{ role: 'test', variables: [] }])
				},
			}),
		)
		const resolvedMembership = await membershipResolver.resolveMemberships({
			request: {
				body: {},
				get: () => '',
			},
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
		expect(resolvedMembership.effective).toStrictEqual([{ role: 'test', variables: [] }])
	})

	it('should return assumed membership', async () => {
		const membershipResolver = new ProjectMembershipResolver(
			false,
			createMock<ProjectMembershipFetcher>({
				fetchMemberships(): Promise<readonly Acl.Membership[]> {
					return Promise.resolve([{ role: 'admin', variables: [] }])
				},
			}),
		)
		const resolvedMembership = await membershipResolver.resolveMemberships({
			request: {
				body: {},
				get: () =>
					JSON.stringify({
						memberships: [{ role: 'test', variables: [{ name: 'lang', values: [JSON.stringify({ eq: 'cs' })] }] }],
					}),
			},
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
		expect(resolvedMembership.effective).toStrictEqual([{ role: 'test', variables: [{ name: 'lang', condition: { eq: 'cs' } }] }])
	})

	it('should return assumed membership from a body', async () => {
		const membershipResolver = new ProjectMembershipResolver(
			false,
			createMock<ProjectMembershipFetcher>({
				fetchMemberships(): Promise<readonly Acl.Membership[]> {
					return Promise.resolve([{ role: 'admin', variables: [] }])
				},
			}),
		)
		const resolvedMembership = await membershipResolver.resolveMemberships({
			request: {
				body: {
					assumeMembership: {
						memberships: [{
							role: 'test',
							variables: [{ name: 'lang', values: [JSON.stringify({ eq: 'cs' })] }],
						}],
					},
				},
				get: () => '',
			},
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
		expect(resolvedMembership.effective).toStrictEqual([{
			role: 'test',
			variables: [{ name: 'lang', condition: { eq: 'cs' } }],
		}])
	})
})
