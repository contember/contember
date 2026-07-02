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
import { createMembershipVariableSql } from './sql/createMembershipVariableSql.js'
import { removeMembershipSql } from './sql/removeMembershipSql.js'
import { createIdentitySql } from './sql/createIdentitySql.js'
import { createPersonSql } from './sql/createPersonSql.js'

// A09 claim mapping grants PROJECT MEMBERSHIPS only (never global/tenant roles). These tests drive a
// configured `claimMapping` through the IdP sign-in path and assert the exact membership reconciliation
// SQL plus the `idp_role_mapped` audit delta. The audit before/after carries `{ memberships }` only.

const baseSignInQuery = signInIDP({
	identityProvider: 'mock',
	idpResponse: { url: 'test' },
	redirectUrl: 'test',
	sessionData: {},
})

const externalIdentifier = 'abcd'
const email = 'john@doe.com'
const mappedProject = (id: string) => ({ id, name: 'demo', slug: 'demo', config: {} } as any)

test('claim mapping grants a project membership on sign-in', async () => {
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
	// uuid() is a global incrementing generator: the membership insert consumes #1, the session key #2.
	const membershipId = testUuid(1)
	const apiKeyId = testUuid(2)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							claims: { department: 'Editorial' },
							claimMapping: {
								rules: [
									{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } },
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// before snapshot: memberships of the mapped project
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				// apply memberships: resolve project, insert membership
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'editor' }),
				// after snapshot
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
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
					unmatched: 'keep',
				},
			},
		],
	})
})

test('claim mapping grants a membership with a claim-derived variable (mapped values written)', async () => {
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
	// membership insert #1, the membership-variable insert #2, the session key #3.
	const membershipId = testUuid(1)
	const variableId = testUuid(2)
	const apiKeyId = testUuid(3)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							// `langs` is the source claim for the `locale` membership variable; it maps cs -> uuid-cs.
							claims: { department: 'Editorial', langs: 'cs' },
							claimMapping: {
								rules: [
									{
										claim: 'department',
										equals: 'Editorial',
										grantMembership: {
											project: 'demo',
											role: 'editor',
											variables: [{ name: 'locale', from: { claim: 'langs', split: ',' }, map: { cs: ['uuid-cs'] } }],
										},
									},
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// before snapshot
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				// apply: resolve project, create membership, write the claim-derived `locale` variable
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'editor' }),
				createMembershipVariableSql({ variableId, membershipId, variableName: 'locale', values: ['uuid-cs'] }),
				// after snapshot
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({
					identityId,
					projectId: mappedProjectId,
					membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['uuid-cs'] }] }],
				}),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId: sessionProjectId }),
			selectMembershipsSql({
				identityId,
				projectId: sessionProjectId,
				membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['uuid-cs'] }] }],
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
					after: { memberships: [{ project: 'demo', role: 'editor', variables: [{ name: 'locale', values: ['uuid-cs'] }] }] },
					syncPolicy: 'always',
					unmatched: 'keep',
				},
			},
		],
	})
})

test('a granted membership whose declared variable resolves to no values keeps the membership (no empty-set soft-delete)', async () => {
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
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							// The match claim is present, but the variable's source claim `langs` is absent, so
							// `locale` resolves to no values. Under `keep` (default) the empty variable is simply
							// dropped — the membership row must survive (no empty `set` → no soft-delete).
							claims: { department: 'Editorial' },
							claimMapping: {
								rules: [
									{
										claim: 'department',
										equals: 'Editorial',
										grantMembership: {
											project: 'demo',
											role: 'editor',
											variables: [{ name: 'locale', from: { claim: 'langs', split: ',' }, map: { cs: ['uuid-cs'] } }],
										},
									},
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// before snapshot
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				// apply: resolve project, create membership only — the empty `locale` variable is NOT written
				// (no createMembershipVariableSql) and the membership row is NOT deleted.
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'editor' }),
				// after snapshot
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId: sessionProjectId }),
			selectMembershipsSql({ identityId, projectId: sessionProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
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
					unmatched: 'keep',
				},
			},
		],
	})
})

test('sticky sync policy skips re-mapping for an existing person (no membership change, no audit)', async () => {
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	const idpId = testUuid(20)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							claims: { department: 'Editorial' },
							claimMapping: {
								syncPolicy: 'sticky',
								rules: [
									{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } },
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// sticky + existing person → mapping is skipped entirely, no snapshot / apply queries
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }],
			}),
		],
		return: {
			data: { signInIDP: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		// Only the login is audited — no idp_role_mapped because nothing was synced.
		expectedAuthLog: { type: 'idp_login', response: expect.objectContaining({ ok: true }) },
	})
})

test('a malformed stored claimMapping is skipped (fail-open) — sign-in succeeds, audited as idp_role_mapping_failed', async () => {
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	const idpId = testUuid(20)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							claims: { department: 'Editorial' },
							// A persisted-but-malformed mapping (a rule with no `claim`) — e.g. written out-of-band
							// before validation existed. parseClaimMapping throws → fail-open: sign-in proceeds
							// without claim mapping and the failure is audited; the user is NOT locked out.
							claimMapping: { rules: [{ contains: 'x', grantMembership: { project: 'demo', role: 'editor' } }] },
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// parse failed before any snapshot/apply query — sign-in continues normally
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: { signInIDP: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		expectedAuthLog: [
			{ type: 'idp_login', response: expect.objectContaining({ ok: true }) },
			{
				type: 'idp_role_mapping_failed',
				response: expect.objectContaining({ ok: true }),
				personId,
				targetPersonId: personId,
				identityProviderId: idpId,
			},
		],
	})
})

test('a claim mapping referencing a non-existent project is skipped, sign-in still succeeds (no audit)', async () => {
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	const idpId = testUuid(20)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							claims: { department: 'Editorial' },
							claimMapping: {
								rules: [
									{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } },
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// before snapshot: project 'demo' does not resolve → skipped (no membership query)
				getProjectBySlugSql({ projectSlug: 'demo', response: null }),
				// apply: project still does not resolve → grant skipped, nothing created/removed
				getProjectBySlugSql({ projectSlug: 'demo', response: null }),
				// after snapshot: still empty → before == after → no audit
				getProjectBySlugSql({ projectSlug: 'demo', response: null }),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: { signInIDP: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		// Nothing changed (project missing) → only the login is audited.
		expectedAuthLog: { type: 'idp_login', response: expect.objectContaining({ ok: true }) },
	})
})

test('unmatched: remove strips a no-longer-granted membership in a mapped project', async () => {
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
	// the membership insert consumes #1, the session key #2.
	const membershipId = testUuid(1)
	const apiKeyId = testUuid(2)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							claims: { department: 'Editorial' },
							claimMapping: {
								unmatched: 'remove',
								rules: [
									{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } },
									// `reviewer` is in the mapping's membership vocabulary (named by this rule) but its
									// claim does not match this sign-in, so under `remove` it is the stale membership stripped.
									{ claim: 'department', equals: 'Management', grantMembership: { project: 'demo', role: 'reviewer' } },
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// before snapshot: identity holds `editor` (still granted) and a stale `reviewer`.
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({
					identityId,
					projectId: mappedProjectId,
					membershipsResponse: [{ role: 'editor', variables: [] }, { role: 'reviewer', variables: [] }],
				}),
				// apply memberships: resolve project, drop the no-longer-granted `reviewer`, (re)create `editor`.
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({
					identityId,
					projectId: mappedProjectId,
					membershipsResponse: [{ role: 'editor', variables: [] }, { role: 'reviewer', variables: [] }],
				}),
				removeMembershipSql({ projectId: mappedProjectId, identityId, role: 'reviewer' }),
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'editor' }),
				// after snapshot: only `editor` remains.
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
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
					before: { memberships: [{ project: 'demo', role: 'editor', variables: [] }, { project: 'demo', role: 'reviewer', variables: [] }] },
					after: { memberships: [{ project: 'demo', role: 'editor', variables: [] }] },
					syncPolicy: 'always',
					unmatched: 'remove',
				},
			},
		],
	})
})

test('unmatched: remove revokes the whole membership when a declared variable resolves empty (no empty-variable grant)', async () => {
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
	// No membership is (re)created: the `editor` grant is REVOKED because its declared `locale` variable resolves
	// empty. The system does not allow an empty membership variable (the direct add-member path hard-deletes such a
	// grant), and CORR-1: clearing a `condition` variable to `[]` would widen it to allow-all — so the whole
	// membership is removed. Revoking is a DELETE (no uuid), so the only uuid consumed is the session key (#1).
	const apiKeyId = testUuid(1)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							// The match claim is present (the rule matches), but the variable's source claim `langs`
							// is gone, so `locale` resolves to no values — an empty-scoped, invalid grant under `remove`.
							claims: { department: 'Editorial' },
							claimMapping: {
								unmatched: 'remove',
								rules: [
									{
										claim: 'department',
										equals: 'Editorial',
										grantMembership: {
											project: 'demo',
											role: 'editor',
											variables: [{ name: 'locale', from: { claim: 'langs', split: ',' }, map: { cs: ['uuid-cs'] } }],
										},
									},
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// before snapshot: identity holds `editor` in demo with a stale claim-derived `locale`.
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({
					identityId,
					projectId: mappedProjectId,
					membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['uuid-stale'] }] }],
				}),
				// apply: resolve project; the removal loop keeps `editor` (still granted this sign-in), but the create
				// loop then REVOKES the whole `editor` membership because its declared `locale` resolves empty — an
				// empty membership variable is not a valid grant (and clearing a condition variable to `[]` would
				// widen it to allow-all instead of denying).
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({
					identityId,
					projectId: mappedProjectId,
					membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['uuid-stale'] }] }],
				}),
				removeMembershipSql({ projectId: mappedProjectId, identityId, role: 'editor' }),
				// after snapshot: `editor` is gone (revoked).
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({
					identityId,
					projectId: mappedProjectId,
					membershipsResponse: [],
				}),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId: sessionProjectId }),
			selectMembershipsSql({
				identityId,
				projectId: sessionProjectId,
				membershipsResponse: [],
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
					before: { memberships: [{ project: 'demo', role: 'editor', variables: [{ name: 'locale', values: ['uuid-stale'] }] }] },
					// the whole `editor` membership is revoked (an empty declared variable is not a valid grant).
					after: { memberships: [] },
					syncPolicy: 'always',
					unmatched: 'remove',
				},
			},
		],
	})
})

test('sticky sync policy APPLIES on a brand-new auto-signed-up person', async () => {
	// uuid order: identity #1, person #2, person_identity_provider #3, membership #4, session key #5.
	const identityId = testUuid(1)
	const personId = testUuid(2)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
	const membershipId = testUuid(4)
	const apiKeyId = testUuid(5)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: true,
						exclusive: true,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							claims: { department: 'Editorial' },
							// sticky → applies ONLY at account creation; this sign-in creates the account.
							claimMapping: {
								syncPolicy: 'sticky',
								rules: [
									{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } },
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				// no existing person → auto sign-up creates the identity + person + IdP link
				getPersonByIdpSql({ externalIdentifier, identityProviderId: idpId, response: null }),
				createIdentitySql({ identityId, roles: ['person'] }),
				createPersonSql({ personId, identityId, name: 'john', idpOnly: true }),
				{
					sql: `insert into  "tenant"."person_identity_provider" ("id", "identity_provider_id", "person_id", "external_identifier") values  (?, ?, ?, ?)`,
					parameters: [testUuid(3), idpId, personId, externalIdentifier],
					response: { rowCount: 1 },
				},
				// claim sync runs with isNewPerson=true → sticky applies → membership granted
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'editor' }),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId: sessionProjectId }),
			selectMembershipsSql({ identityId, projectId: sessionProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
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
					syncPolicy: 'sticky',
					unmatched: 'keep',
				},
			},
		],
	})
})

test('unmatched: remove revokes a vocabulary membership even when no rule matches this sign-in', async () => {
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
	// Nothing is created (only a removal), so the session key is the first uuid() consumer.
	const apiKeyId = testUuid(1)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							// The claim no longer matches at all (department changed), so `editor` is not granted —
							// yet `demo::editor` is in the mapping's vocabulary and must still be reconciled away.
							claims: { department: 'Sales' },
							claimMapping: {
								unmatched: 'remove',
								rules: [
									{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } },
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// before snapshot: identity still holds the stale `editor` in demo.
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
				// apply memberships: demo is in vocabulary, so it is reconciled even though nothing was granted;
				// `editor` is in vocabulary and not granted now → stripped. Nothing to create.
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
				removeMembershipSql({ projectId: mappedProjectId, identityId, role: 'editor' }),
				// after snapshot: demo membership is gone.
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId: sessionProjectId }),
			selectMembershipsSql({ identityId, projectId: sessionProjectId, membershipsResponse: [] }),
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
					before: { memberships: [{ project: 'demo', role: 'editor', variables: [] }] },
					after: { memberships: [] },
					syncPolicy: 'always',
					unmatched: 'remove',
				},
			},
		],
	})
})

test('unmatched: remove never strips a membership outside the mapping vocabulary (a manually-granted admin survives)', async () => {
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
	// editor (re)created consumes #1, the session key #2.
	const membershipId = testUuid(1)
	const apiKeyId = testUuid(2)
	const project = mappedProject(mappedProjectId)
	// before/apply: identity holds editor (still granted), a stale reviewer (in the mapping vocabulary)
	// and admin (named by NO rule → outside the vocabulary). Only reviewer may be removed; admin and the
	// re-granted editor must survive — this pins the `vocabularyRoles.has(...)` bound in applyMemberships.
	// admin survives in the DB (no remove command, still in the after-snapshot response) but, being outside
	// the vocabulary, is NOT disclosed in the audit before/after delta (snapshot is vocabulary-bounded).
	const existing = [
		{ role: 'editor', variables: [] },
		{ role: 'reviewer', variables: [] },
		{ role: 'admin', variables: [] },
	]
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							claims: { department: 'Editorial' },
							claimMapping: {
								unmatched: 'remove',
								rules: [
									{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } },
									{ claim: 'department', equals: 'Management', grantMembership: { project: 'demo', role: 'reviewer' } },
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// before snapshot
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: existing }),
				// apply: reconcile — only the in-vocabulary, no-longer-granted `reviewer` is removed; `admin`
				// (outside the vocabulary) is left untouched, `editor` (granted) is (re)created.
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: existing }),
				removeMembershipSql({ projectId: mappedProjectId, identityId, role: 'reviewer' }),
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'editor' }),
				// after snapshot: editor + admin remain, reviewer gone.
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
			getIdentityProjectsSql({ identityId, projectId: sessionProjectId }),
			selectMembershipsSql({ identityId, projectId: sessionProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
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
					// admin is held but outside the vocabulary → excluded from the delta (SEC-1: the snapshot is
					// bounded to the mapping's own (project, role) pairs, so memberships managed outside it are not
					// disclosed in the audit). before = editor + the stale reviewer; after = only editor.
					before: {
						memberships: [
							{ project: 'demo', role: 'editor', variables: [] },
							{ project: 'demo', role: 'reviewer', variables: [] },
						],
					},
					after: {
						memberships: [
							{ project: 'demo', role: 'editor', variables: [] },
						],
					},
					syncPolicy: 'always',
					unmatched: 'remove',
				},
			},
		],
	})
})

test('a passthrough claim-derived variable writes only allow-listed values (the disallowed raw claim is filtered)', async () => {
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
	// membership insert #1, the membership-variable insert #2, the session key #3.
	const membershipId = testUuid(1)
	const variableId = testUuid(2)
	const apiKeyId = testUuid(3)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							// `langs` carries an allowed value (cs) and a disallowed one (de); passthrough would write
							// both verbatim, but `allow` must filter the raw claim down to `cs` before it is persisted.
							claims: { department: 'Editorial', langs: 'cs,de' },
							claimMapping: {
								rules: [
									{
										claim: 'department',
										equals: 'Editorial',
										grantMembership: {
											project: 'demo',
											role: 'editor',
											variables: [{ name: 'locale', from: { claim: 'langs', split: ',' }, passthrough: true, allow: ['cs', 'en'] }],
										},
									},
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'editor' }),
				// only the allow-listed `cs` is written; the disallowed raw `de` never reaches the DB.
				createMembershipVariableSql({ variableId, membershipId, variableName: 'locale', values: ['cs'] }),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({
					identityId,
					projectId: mappedProjectId,
					membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }],
				}),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
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
					after: { memberships: [{ project: 'demo', role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }] },
					syncPolicy: 'always',
					unmatched: 'keep',
				},
			},
		],
	})
})

test('TEST-4: a claimMapping carrying only the OIDC identity-field remap (no rules) is a no-op for A09 (no apply, no audit)', async () => {
	// The OIDC provider stores its identity-field remap under the same `configuration.claimMapping` key.
	// A09 only acts on `rules`, so a remap-only object is "no A09 mapping" (parseClaimMapping → null): the
	// sign-in runs NO membership snapshot/apply SQL and emits neither idp_role_mapped nor idp_role_mapping_failed.
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	const idpId = testUuid(20)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			...sqlTransaction(
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							claims: { department: 'Editorial' },
							// remap-only claimMapping (the OIDC identity-field remap) — no `rules`, so A09 self-skips
							claimMapping: { email: 'mail', name: 'displayName', externalIdentifier: 'sub' },
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// no rules → A09 self-skips: no snapshot / project / membership SQL at all
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: { signInIDP: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		// A09 self-skipped (no rules) → only the login is audited
		expectedAuthLog: { type: 'idp_login', response: expect.objectContaining({ ok: true }) },
	})
})

test('a passthrough claim-derived variable with allow:[] writes no variable, keeping the membership', async () => {
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
				getIdpBySlugSql({
					slug: 'mock',
					response: {
						id: idpId,
						autoSignUp: false,
						exclusive: false,
						initReturnsConfig: false,
						requireVerifiedEmail: false,
						assumeEmailVerified: false,
						configuration: {
							externalIdentifier,
							email,
							claims: { department: 'Editorial', langs: 'cs,de' },
							// allow:[] rejects every derived value → `locale` resolves empty → no variable row is
							// written, and the membership itself is still created (empty variables are dropped).
							claimMapping: {
								rules: [
									{
										claim: 'department',
										equals: 'Editorial',
										grantMembership: {
											project: 'demo',
											role: 'editor',
											variables: [{ name: 'locale', from: { claim: 'langs', split: ',' }, passthrough: true, allow: [] }],
										},
									},
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'editor' }),
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId: sessionProjectId }),
			selectMembershipsSql({ identityId, projectId: sessionProjectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
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
					unmatched: 'keep',
				},
			},
		],
	})
})
