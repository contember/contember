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

// Tests added with the A09 review fixes:
//  - SEC-1: the apply-time backstop distinguishes "project absent" (keep, inert) from "project exists but
//    schema unresolvable" (fail-closed → drop), so an unvalidated grant can never land for an existing project.
//  - TEST-3: a partial drop — one safe + one unsafe rule in the SAME sign-in — applies the safe grant AND
//    emits the fail-open marker.
//  - TEST-4: an allow-bounded claim-derived `condition` variable is written end-to-end with ONLY the
//    allow-listed value (lives in signInIdpClaimMapping.test.ts' companion suite — kept here with the rest).

const baseSignInQuery = signInIDP({
	identityProvider: 'mock',
	idpResponse: { url: 'test' },
	redirectUrl: 'test',
	sessionData: {},
})

const externalIdentifier = 'abcd'
const email = 'john@doe.com'
const mappedProject = (id: string) => ({ id, name: 'demo', slug: 'demo', config: {} } as any)

const editorRule = { claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'editor' } }
const noSchemaResolver = { getSchema: () => Promise.resolve(undefined) }

test('SEC-1: a grant for a project that does not exist yet is KEPT but inert — no write, no failure marker', async () => {
	// getSchema returns undefined AND no `project` row exists → genuinely inert (applyMemberships skips it),
	// so the rule is kept for when the project is created later. Nothing is written and, crucially, NO
	// idp_role_mapping_failed marker is emitted (the rule wasn't dropped) — only the login is audited.
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const sessionProjectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		projectSchemaResolver: noSchemaResolver,
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
						configuration: { externalIdentifier, email, claims: { department: 'Editorial' }, claimMapping: { rules: [editorRule] } },
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({ externalIdentifier, identityProviderId: idpId, response: { email, password: '123', identityId, personId, roles: [] } }),
				// dropUnsafeRules existence check → no row → keep; then before/apply/after each resolve the slug and skip
				getProjectBySlugSql({ projectSlug: 'demo', response: null }),
				getProjectBySlugSql({ projectSlug: 'demo', response: null }),
				getProjectBySlugSql({ projectSlug: 'demo', response: null }),
				getProjectBySlugSql({ projectSlug: 'demo', response: null }),
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
		expectedAuthLog: { type: 'idp_login', response: expect.objectContaining({ ok: true }) },
	})
})

test('SEC-1: a grant for an EXISTING project whose schema is unresolvable is DROPPED (fail-closed) + failure marker', async () => {
	// getSchema returns undefined but the `project` row EXISTS (mid-provisioning / transient): applyMemberships
	// would otherwise write an UNVALIDATED grant, so the backstop drops the rule and emits idp_role_mapping_failed.
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
	const apiKeyId = testUuid(1)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		projectSchemaResolver: noSchemaResolver,
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
						configuration: { externalIdentifier, email, claims: { department: 'Editorial' }, claimMapping: { rules: [editorRule] } },
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({ externalIdentifier, identityProviderId: idpId, response: { email, password: '123', identityId, personId, roles: [] } }),
				// dropUnsafeRules existence check → row EXISTS but no schema → DROP → empty effective mapping (no snapshot/apply)
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
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
				type: 'idp_role_mapping_failed',
				response: expect.objectContaining({ ok: true }),
				personId,
				targetPersonId: personId,
				identityProviderId: idpId,
			},
		],
	})
})

test('TEST-3: a partial drop applies the safe grant AND still emits the fail-open marker for the dropped rule', async () => {
	// Two rules in the same sign-in: one safe (`editor`), one unsafe (claim-derived unbounded `condition`
	// variable → dropped at apply). The safe grant must still be applied and audited as idp_role_mapped,
	// while the dropped rule still raises idp_role_mapping_failed. (Both rules grant `editor@demo`; the unsafe
	// rule is dropped BEFORE evaluation, so its unsafe variable never reaches the apply.)
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
							claims: { department: 'Editorial', filter: '{"eq":"x"}' },
							claimMapping: {
								rules: [
									editorRule,
									{
										claim: 'department',
										equals: 'Editorial',
										grantMembership: { project: 'demo', role: 'editor', variables: [{ name: 'siteFilter', from: { claim: 'filter' } }] },
									},
								],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({ externalIdentifier, identityProviderId: idpId, response: { email, password: '123', identityId, personId, roles: [] } }),
				// before snapshot
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				// apply: the safe `editor` grant is written
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

test('TEST-4: an allow-bounded claim-derived `condition` variable writes ONLY the allow-listed condition end-to-end', async () => {
	// `siteFilter` is a `condition` ACL variable: its stored value is parsed as a row-level ACL WHERE on every
	// content request, so a wrong value is arbitrary-condition injection. This drives a SAFE, allow-bounded
	// claim-derived condition value through the whole apply path and asserts the exact value PERSISTED — the
	// `map` emits two conditions, `allow` permits only one, and only that one is written.
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const sessionProjectId = testUuid(10)
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
							claims: { department: 'Editorial', site: ['a', 'b'] },
							claimMapping: {
								rules: [{
									claim: 'department',
									equals: 'Editorial',
									grantMembership: {
										project: 'demo',
										role: 'editor',
										variables: [{
											name: 'siteFilter',
											from: { claim: 'site' },
											map: { a: ['{"eq":"site-1"}'], b: ['{"eq":"site-2"}'] },
											allow: ['{"eq":"site-1"}'],
										}],
									},
								}],
							},
						},
						disabledAt: null,
						slug: 'mock',
						type: 'mock',
					},
				}),
				getPersonByIdpSql({ externalIdentifier, identityProviderId: idpId, response: { email, password: '123', identityId, personId, roles: [] } }),
				// before snapshot
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
				// apply: write ONLY the allow-listed condition value (site-2 filtered out)
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'editor' }),
				createMembershipVariableSql({ variableId, membershipId, variableName: 'siteFilter', values: ['{"eq":"site-1"}'] }),
				// after snapshot
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({
					identityId,
					projectId: mappedProjectId,
					membershipsResponse: [{ role: 'editor', variables: [{ name: 'siteFilter', values: ['{"eq":"site-1"}'] }] }],
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
				membershipsResponse: [{ role: 'editor', variables: [{ name: 'siteFilter', values: ['{"eq":"site-1"}'] }] }],
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
					after: { memberships: [{ project: 'demo', role: 'editor', variables: [{ name: 'siteFilter', values: ['{"eq":"site-1"}'] }] }] },
					syncPolicy: 'always',
					unmatched: 'keep',
				},
			},
		],
	})
})
