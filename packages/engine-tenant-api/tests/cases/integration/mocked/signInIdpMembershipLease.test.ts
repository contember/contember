import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { signInIDP } from './gql/signInIdp.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { getIdpBySlugSql } from './sql/getIdpBySlugSql.js'
import { getPersonByIdpSql } from './sql/getPersonByIdpSql.js'
import { createSessionKeySql } from './sql/createSessionKeySql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'
import { getAuthPoliciesSql } from './sql/authPolicySql.js'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'
import { createMembershipSql } from './sql/createMembershipSql.js'
import { removeMembershipSql } from './sql/removeMembershipSql.js'
import { purgeExpiredMembershipLeasesSql } from './sql/purgeExpiredMembershipLeasesSql.js'
import { MEMBERSHIP_LEASE_SWEEP_LIMIT } from '../../../../src/index.js'

// A32 — a claim mapping that configures a `membershipLease` drives sign-in exactly as it did before,
// with two additions: every membership it grants is written with an expiry and its grantor, and the
// commit is followed by a bounded sweep of leases that already lapsed.

const baseSignInQuery = signInIDP({
	identityProvider: 'mock',
	idpResponse: { url: 'test' },
	redirectUrl: 'test',
	sessionData: {},
})

const externalIdentifier = 'abcd'
const email = 'john@doe.com'
const mappedProject = (id: string) => ({ id, name: 'demo', slug: 'demo', config: {} } as any)
const lease = { duration: '30 days', identityProviderId: testUuid(20) }

const idpSql = (claimMapping: unknown) =>
	getIdpBySlugSql({
		slug: 'mock',
		response: {
			id: testUuid(20),
			autoSignUp: false,
			exclusive: false,
			initReturnsConfig: false,
			requireVerifiedEmail: false,
			assumeEmailVerified: false,
			configuration: { externalIdentifier, email, claims: { department: 'Editorial' }, claimMapping },
			disabledAt: null,
			slug: 'mock',
			type: 'mock',
		},
	})

const leasedMapping = {
	unmatched: 'remove',
	membershipLease: '30 days',
	rules: [
		{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } },
		// in the mapping's vocabulary but not granted by these claims — the stale grant `remove` strips
		{ claim: 'department', equals: 'Management', grantMembership: { project: 'demo', role: 'reviewer' } },
	],
}

test('a leased mapping stamps the expiry on the membership it grants, then sweeps lapsed leases after the commit', async () => {
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
	// the membership insert consumes uuid #1, the session key #2
	const membershipId = testUuid(1)
	const apiKeyId = testUuid(2)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				idpSql(leasedMapping),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// before snapshot
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				// apply: nothing to reconcile away, and `editor` is written with its lease
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'editor', lease }),
				// after snapshot
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			// outside the transaction: the sweep must not hold other identities' row locks across a sign-in
			purgeExpiredMembershipLeasesSql({ limit: MEMBERSHIP_LEASE_SWEEP_LIMIT }),
			getIdentityProjectsSql({ identityId, projectId: sessionProjectId }),
			selectMembershipsSql({
				identityId,
				projectId: sessionProjectId,
				membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }],
			}),
		],
		return: {
			data: { signInIDP: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		expectedAuthLog: [
			{ type: 'idp_login', response: expect.objectContaining({ ok: true }) },
			{
				type: 'idp_role_mapped',
				response: expect.objectContaining({ ok: true }),
				personId,
				targetPersonId: personId,
				identityProviderId: idpId,
				eventData: {
					before: { memberships: [] },
					after: { memberships: [{ project: 'demo', role: 'editor', variables: [] }] },
					syncPolicy: 'always',
					unmatched: 'remove',
				},
			},
		],
	})
})

test('a lease is stamped only on what the mapping grants — an operator-managed membership keeps none', async () => {
	// `admin` here was granted by hand and is named by no rule, so it is outside the mapping's membership
	// vocabulary. That bound governs the lease exactly as it already governs removal: `admin` is neither
	// stripped nor stamped, and therefore can never expire. `reviewer` IS in the vocabulary and is stripped.
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
	const membershipId = testUuid(1)
	const apiKeyId = testUuid(2)
	const project = mappedProject(mappedProjectId)
	const existing = [
		{ role: 'editor', variables: [] },
		{ role: 'reviewer', variables: [] },
		{ role: 'admin', variables: [] },
	]
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				idpSql(leasedMapping),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: existing }),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: existing }),
				removeMembershipSql({ projectId: mappedProjectId, identityId, role: 'reviewer' }),
				// the ONLY write that carries a lease — `admin` gets no statement at all
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'editor', lease }),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({
					identityId,
					projectId: mappedProjectId,
					membershipsResponse: [{ role: 'editor', variables: [] }, { role: 'admin', variables: [] }],
				}),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			purgeExpiredMembershipLeasesSql({ limit: MEMBERSHIP_LEASE_SWEEP_LIMIT }),
			getIdentityProjectsSql({ identityId, projectId: sessionProjectId }),
			selectMembershipsSql({
				identityId,
				projectId: sessionProjectId,
				membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }],
			}),
		],
		return: {
			data: { signInIDP: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		expectedAuthLog: [
			{ type: 'idp_login', response: expect.objectContaining({ ok: true }) },
			{
				type: 'idp_role_mapped',
				response: expect.objectContaining({ ok: true }),
				personId,
				targetPersonId: personId,
				identityProviderId: idpId,
				eventData: {
					// the delta stays vocabulary-bounded, so the hand-granted `admin` is not disclosed here either
					before: { memberships: [{ project: 'demo', role: 'editor', variables: [] }, { project: 'demo', role: 'reviewer', variables: [] }] },
					after: { memberships: [{ project: 'demo', role: 'editor', variables: [] }] },
					syncPolicy: 'always',
					unmatched: 'remove',
				},
			},
		],
	})
})

test('a mapping with no lease grants without an expiry and runs no sweep', async () => {
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
	const membershipId = testUuid(1)
	const apiKeyId = testUuid(2)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				idpSql({ unmatched: 'remove', rules: leasedMapping.rules }),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'editor' }),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			// no sweep statement here: nothing in this deployment leases anything
			getIdentityProjectsSql({ identityId, projectId: sessionProjectId }),
			selectMembershipsSql({
				identityId,
				projectId: sessionProjectId,
				membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }],
			}),
		],
		return: {
			data: { signInIDP: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		expectedAuthLog: [
			{ type: 'idp_login', response: expect.objectContaining({ ok: true }) },
			{
				type: 'idp_role_mapped',
				response: expect.objectContaining({ ok: true }),
				personId,
				targetPersonId: personId,
				identityProviderId: idpId,
				eventData: {
					before: { memberships: [] },
					after: { memberships: [{ project: 'demo', role: 'editor', variables: [] }] },
					syncPolicy: 'always',
					unmatched: 'remove',
				},
			},
		],
	})
})
