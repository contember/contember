import { describe, expect, it } from 'bun:test'
import { ProjectMembershipFetcher, ProjectMembershipResolver } from '../../../src/index.js'
import { createMock } from '../../utils.js'
import { Acl } from '@contember/schema'
import { HttpErrorResponse } from '../../../src/common/HttpResponse.js'

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

	it('should resolve the variables of an implicit role', async () => {
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
							category: { type: Acl.VariableType.entity, entityName: 'Category', fallback: { eq: 'none' } },
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
				{ name: 'category', condition: { eq: 'none' } },
			],
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

	const resolveWithAssumeHeader = async (header: string, storedMemberships: readonly Acl.Membership[]): Promise<unknown> => {
		const membershipResolver = new ProjectMembershipResolver(
			false,
			createMock<ProjectMembershipFetcher>({
				fetchMemberships: () => Promise.resolve(storedMemberships),
			}),
		)
		try {
			await membershipResolver.resolveMemberships({
				request: { body: {}, get: name => name === 'x-contember-assume-membership' ? header : '' },
				projectSlug: 'test',
				identity: { identityId: 'd4141336-6512-41ef-a25a-374de35a2806', roles: [] },
				acl: {
					roles: {
						editor: { variables: {}, entities: {}, content: { assumeMembership: { viewer: true } } },
						viewer: { variables: {}, entities: {} },
					},
				},
			})
			return null
		} catch (e) {
			return e
		}
	}

	it('answers 400 for an assume-membership header that is not JSON', async () => {
		const error = await resolveWithAssumeHeader('{not json', [{ role: 'editor', variables: [] }])
		expect(error).toBeInstanceOf(HttpErrorResponse)
		expect(error).toMatchObject({ code: 400, message: 'Invalid JSON in x-contember-assume-membership header' })
	})

	it('answers 400 for an assume-membership header of a wrong shape', async () => {
		const error = await resolveWithAssumeHeader('{"memberships": "viewer"}', [{ role: 'editor', variables: [] }])
		expect(error).toBeInstanceOf(HttpErrorResponse)
		expect(error).toMatchObject({ code: 400 })
	})

	it('a stored role missing from the ACL may not assume a membership', async () => {
		const header = JSON.stringify({ memberships: [{ role: 'viewer', variables: [] }] })
		const error = await resolveWithAssumeHeader(header, [{ role: 'removed', variables: [] }])
		expect(error).toBeInstanceOf(HttpErrorResponse)
		expect(error).toMatchObject({ code: 403 })
	})

	it('a stored role with an assume rule still assumes the allowed membership', async () => {
		const header = JSON.stringify({ memberships: [{ role: 'viewer', variables: [] }] })
		expect(await resolveWithAssumeHeader(header, [{ role: 'editor', variables: [] }])).toBeNull()
	})
})
