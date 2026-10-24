import { describe, test } from 'bun:test'
import { authenticatedIdentityId, executeTenantTest } from '../../../../src/testTenant.js'
import { testUuid } from '../../../../src/testUuid.js'
import { GQL } from '../../../../src/tags.js'
import { AuthCredential, PermissionActions } from '../../../../../src/index.js'
import { allTrustsSql, identityKindSql, trustByIdentitySql, trustDbRow, trustMembershipsSql, trustTimestamp } from './workloadIdentitySql.js'

const identityId = testUuid(70)
const trustId = testUuid(71)
const projectId = testUuid(50)
const rule = { reviewer: {} }

describe('workloadIdentityTrusts', () => {
	test('lists the full definition, also to a caller authenticated through a trust', async () => {
		const credential: AuthCredential = { type: 'workload_trust', trustId: testUuid(900), trustSlug: 'ci', tokenRef: 'jti-1' }
		await executeTenantTest({
			query: GQL`query {
				workloadIdentityTrusts {
					id slug profile issuer audience jwksUri signingAlgs acceptedTyp acceptAudienceArray requireDpop conditions
					maxTokenLifetime trustForwardedInfo description disabled tokensValidAfter roles createdAt updatedAt
					memberships { project role variables { name values } assumeMembership }
					identity { id }
				}
			}`,
			callerCredential: credential,
			executes: [
				allTrustsSql([
					trustDbRow({
						id: trustId,
						slug: 'sites-sync',
						identity_id: identityId,
						profile: 'github-actions',
						signing_algs: ['RS256'],
						accepted_typ: ['JWT'],
					}),
				]),
				trustMembershipsSql([identityId], [{
					id: testUuid(72),
					identityId,
					projectId,
					projectSlug: 'blog',
					role: 'editor',
					variables: [{ name: 'language', values: ['cs'] }],
					rule,
				}]),
			],
			return: {
				data: {
					workloadIdentityTrusts: [{
						id: trustId,
						slug: 'sites-sync',
						profile: 'github_actions',
						issuer: 'https://auth.example.com',
						audience: 'contember:test:web',
						jwksUri: null,
						signingAlgs: ['RS256'],
						acceptedTyp: ['JWT'],
						acceptAudienceArray: false,
						requireDpop: false,
						conditions: [{ claim: 'sub', equals: 'web-backend' }],
						maxTokenLifetime: 3600,
						trustForwardedInfo: false,
						description: null,
						disabled: false,
						tokensValidAfter: trustTimestamp.toISOString(),
						roles: [],
						createdAt: trustTimestamp.toISOString(),
						updatedAt: trustTimestamp.toISOString(),
						memberships: [{ project: 'blog', role: 'editor', variables: [{ name: 'language', values: ['cs'] }], assumeMembership: rule }],
						identity: { id: identityId },
					}],
				},
			},
		})
	})
})

describe('Identity.kind and Identity.workloadIdentityTrust', () => {
	const query = GQL`query { me { id kind workloadIdentityTrust { slug } } }`

	test('resolve the trust of a workload identity', async () => {
		await executeTenantTest({
			query,
			executes: [
				identityKindSql(authenticatedIdentityId, 'workload'),
				trustByIdentitySql([authenticatedIdentityId], [trustDbRow({ id: trustId, slug: 'web', identity_id: authenticatedIdentityId })]),
				trustMembershipsSql([authenticatedIdentityId], []),
			],
			return: { data: { me: { id: authenticatedIdentityId, kind: 'WORKLOAD', workloadIdentityTrust: { slug: 'web' } } } },
		})
	})

	test('hide the trust from a caller that may not list trusts', async () => {
		const listAction = PermissionActions.WORKLOAD_IDENTITY_LIST
		await executeTenantTest({
			query,
			authorizator: {
				isAllowed: (identity: unknown, scope: unknown, action: { resource: string; privilege: string }) =>
					Promise.resolve(!(action.resource === listAction.resource && action.privilege === listAction.privilege)),
			},
			executes: [identityKindSql(authenticatedIdentityId, 'api_key')],
			return: { data: { me: { id: authenticatedIdentityId, kind: 'API_KEY', workloadIdentityTrust: null } } },
		})
	})
})
