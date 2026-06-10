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

	it('should reject an assumed membership the invoker is not allowed to assume (403)', async () => {
		// The invoker holds `viewer`, whose schema only permits assuming `editor`.
		// Assuming `admin` is a well-formed, existing role (so membership resolution
		// succeeds) but is outside the assumeMembership rule, so `verifyAssumedRoles`
		// must reject with 403. This pins the escalation guard at the wiring level:
		// if the gate were ever no-op'd, this test fails.
		const membershipResolver = new ProjectMembershipResolver(
			false,
			createMock<ProjectMembershipFetcher>({
				fetchMemberships(): Promise<readonly Acl.Membership[]> {
					return Promise.resolve([{ role: 'viewer', variables: [] }])
				},
			}),
		)
		const promise = membershipResolver.resolveMemberships({
			request: {
				body: {},
				get: () => JSON.stringify({ memberships: [{ role: 'admin', variables: [] }] }),
			},
			projectSlug: 'test',
			identity: {
				identityId: 'd4141336-6512-41ef-a25a-374de35a2806',
				roles: [],
			},
			acl: {
				roles: {
					viewer: {
						variables: {},
						entities: {},
						content: { assumeMembership: { editor: { variables: true } } },
					},
					editor: { variables: {}, entities: {} },
					admin: { variables: {}, entities: {} },
				},
			},
		})
		await expect(promise).rejects.toMatchObject({ code: 403 })
	})
})
