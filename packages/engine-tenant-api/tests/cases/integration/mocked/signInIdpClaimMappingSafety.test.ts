import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { signInIDP } from './gql/signInIdp.js'
import { SQL } from '../../../src/tags.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { getIdpBySlugSql } from './sql/getIdpBySlugSql.js'
import { getPersonByIdpSql } from './sql/getPersonByIdpSql.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { createSessionKeySql } from './sql/createSessionKeySql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'
import { getAuthPoliciesSql } from './sql/authPolicySql.js'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'
import { createMembershipSql } from './sql/createMembershipSql.js'
import { Acl, Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'

// Safety properties of the A09 claim-mapping apply path that are NOT happy-path reconciliation (covered
// in signInIdpClaimMapping.test.ts): the fail-CLOSED-on-DB-error transaction boundary, the sticky policy
// on an existing account linked by e-mail, and the apply-time condition-variable injection guard.

const baseSignInQuery = signInIDP({
	identityProvider: 'mock',
	idpResponse: { url: 'test' },
	redirectUrl: 'test',
	sessionData: {},
})

const externalIdentifier = 'abcd'
const email = 'john@doe.com'
const mappedProject = (id: string) => ({ id, name: 'demo', slug: 'demo', config: {} } as any)

// An `admin` role carrying a REQUIRED (no-fallback) `site` variable: a claim-derived value is needed to
// scope the grant. ProjectScope grants the PROJECT_ADMIN tenant role from the `admin` role NAME alone
// (independent of the membership's variables), so a BARE `admin` membership — what's left after the apply
// path filters out a `site` that resolved empty — would be UNSCOPED project-admin.
const adminWithRequiredVariableSchema: Schema = {
	...emptySchema,
	acl: {
		roles: {
			admin: { stages: '*', entities: {}, variables: { site: { type: Acl.VariableType.entity, entityName: 'Site' } } },
		},
	},
}
const adminWithRequiredVariableResolver = { getSchema: () => Promise.resolve(adminWithRequiredVariableSchema) }

// An `admin` role with NO variables — the conventional unrestricted admin. Granting it via A09 is
// legitimate (there is no required variable to be missing) and must NOT be dropped by the runtime backstop.
const adminWithoutVariablesSchema: Schema = {
	...emptySchema,
	acl: { roles: { admin: { stages: '*', entities: {}, variables: {} } } },
}
const adminWithoutVariablesResolver = { getSchema: () => Promise.resolve(adminWithoutVariablesSchema) }

test('a DB error during the membership apply rolls back the whole sign-in (no session created)', async () => {
	// A09 invariant: a DB error during the claim-mapping apply is NOT caught — it propagates and rolls
	// back the whole sign-in transaction, so a half-applied set of grants is never committed (failing
	// sign-in on an infra error is the safe outcome). This pins that the apply is NOT wrapped in a
	// fail-open try/catch like the malformed-config parse is. The failure is simulated by the membership
	// upsert returning no row (the command then throws ImplementationException mid-apply).
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const idpId = testUuid(20)
	const mappedProjectId = testUuid(30)
	const membershipId = testUuid(1)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		query: baseSignInQuery,
		executes: [
			{ sql: SQL`BEGIN;`, response: { rowCount: 1 } },
			{ sql: SQL`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ`, response: { rowCount: 1 } },
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
			// before snapshot
			getProjectBySlugSql({ projectSlug: 'demo', response: project }),
			selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
			// apply: resolve project, then the membership upsert returns NO row → ImplementationException
			getProjectBySlugSql({ projectSlug: 'demo', response: project }),
			{
				sql: SQL`INSERT INTO "tenant"."project_membership" ("id", "project_id", "identity_id", "role")
				         VALUES (?, ?, ?, ?)
				         ON CONFLICT ("project_id", "identity_id", "role") DO UPDATE SET "role" = ?
				         RETURNING "id"`,
				parameters: [membershipId, mappedProjectId, identityId, 'editor', 'editor'],
				response: { rows: [] },
			},
			// The apply throws here; the exception propagates out of the transaction so COMMIT is never
			// reached (no `COMMIT;` is enqueued below) — i.e. the sign-in is rolled back, not committed.
			// (The connection mock surfaces the throw without emitting a ROLLBACK statement of its own.)
		],
		return: (response: any) => {
			expect(response.data?.signInIDP ?? null).toBe(null)
			expect(Array.isArray(response.errors) && response.errors.length > 0).toBe(true)
		},
		// the sign-in throws before the resolver audits anything, so no auth log is emitted
	})
})

test('sticky leaves an existing local account being LINKED to the IdP untouched (no membership apply)', async () => {
	// ClaimMapping doc: `sticky` applies only at auto-sign-up account creation; an existing account —
	// "including one being linked to this IdP for the first time" — is left untouched. This pins the third
	// branch of resolvePerson: a pre-existing LOCAL account matched by e-mail and linked here for the first
	// time returns WITHOUT isNewPerson, so a sticky mapping self-skips and no membership SQL runs. A
	// regression setting isNewPerson on the e-mail-link path would silently grant memberships to an
	// established account on first federated login.
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
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
						// non-exclusive → the e-mail-link branch of resolvePerson is reachable
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
				// no IdP link yet → fall through to the e-mail match, which finds the existing local account
				getPersonByIdpSql({ externalIdentifier, identityProviderId: idpId, response: null }),
				getPersonByEmailSql({ email, response: { personId, identityId, password: '123', roles: [] } }),
				// link the IdP identity to that account (uuid #1) — the account is NOT newly created
				{
					sql: `insert into  "tenant"."person_identity_provider" ("id", "identity_provider_id", "person_id", "external_identifier") values  (?, ?, ?, ?)`,
					parameters: [testUuid(1), idpId, personId, externalIdentifier],
					response: { rowCount: 1 },
				},
				// sticky + existing person (isNewPerson is unset) → mapping is skipped entirely, no apply SQL
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId: testUuid(2), identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: { signInIDP: { ok: true, errors: [], result: { token: '0000000000000000000000000000000000000000' } } },
		},
		// only the login is audited — sticky self-skipped, so no idp_role_mapped
		expectedAuthLog: { type: 'idp_login', response: expect.objectContaining({ ok: true }) },
	})
})

test('apply-time guard drops a grant that would inject a claim into a condition ACL variable (SEC-1/SEC-2)', async () => {
	// A mapping that feeds a claim-derived value into a `condition` ACL variable without an `allow` bound is
	// an arbitrary-condition injection vector. Config-time validation normally rejects it, but it is skipped
	// when the project does not exist yet (and never re-run), and a variable's ACL type can flip to
	// `condition` after the mapping was authored. Here such a mapping is already stored; the apply-time
	// backstop re-validates against the LIVE schema (the harness `editor` role has a `siteFilter` condition
	// variable) and DROPS the unsafe grant — so NO membership/variable SQL runs and nothing is audited as
	// mapped, while sign-in still succeeds (fail-open).
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
							claims: { department: 'Editorial', filter: '{"eq":"x"}' },
							// `siteFilter` is a condition variable in the harness ACL; a claim-derived value with no
							// `allow` allowlist is the injection vector the apply-time guard must drop.
							claimMapping: {
								rules: [
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
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// the unsafe rule is dropped against the live schema → empty effective mapping → no snapshot,
				// no project resolution, no membership writes
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
		// the unsafe rule was dropped at apply time → sign-in succeeds (fail-open), audited as the login PLUS
		// an idp_role_mapping_failed marker so the dropped (unsafe) grant is visible to the operator (COMP-1)
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

test('TEST-1: under unmatched:remove, a rule dropped by the apply-time guard does NOT strip the matching pre-existing membership', async () => {
	// The security-load-bearing interaction: a dropped unsafe rule must be removed from the removal
	// VOCABULARY as well as the granted set, so the guard can never flip into a membership-STRIPPING
	// denial vector. Here `editor` is granted via an unsafe (claim-derived, unbounded `condition`)
	// variable AND the identity already holds `editor`, under `unmatched: remove`. The rule is dropped,
	// so `editor` is absent from the vocabulary → reconciliation never runs → NO removeMembership SQL,
	// and the existing membership survives. (A regression dropping only from the granted set would strip
	// `editor` on every sign-in.) Effective mapping is empty → no snapshot / project / membership writes.
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
							claims: { department: 'Editorial', filter: '{"eq":"x"}' },
							claimMapping: {
								unmatched: 'remove',
								rules: [
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
				getPersonByIdpSql({
					externalIdentifier,
					identityProviderId: idpId,
					response: { email, password: '123', identityId, personId, roles: [] },
				}),
				// the only unsafe rule is dropped → empty effective mapping AND empty removal vocabulary, so NO
				// snapshot / project resolution / removeMembership runs (a stripped editor would show up here)
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId }),
			// the pre-existing editor membership is intact in the post-sign-in session read (never reconciled)
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [{ role: 'editor', variables: [] }] }),
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

test('SEC: apply-time guard drops an `admin` grant whose claim-derived variable resolved empty (no UNSCOPED project-admin)', async () => {
	// The role-name escalation: ProjectScope grants the PROJECT_ADMIN tenant role (project secrets, member
	// management, IdP config, deploy, …) to any identity holding an `admin` membership, keyed on the role
	// NAME alone — NOT on the membership variables. Here a mapping grants `admin` SCOPED by a claim-derived
	// `site` variable, but the source claim is absent, so `site` resolves empty. The config-shape guard
	// (dropUnsafeRules) tolerates that (an A09 grant may set only some variables), so without the runtime
	// backstop the apply path would filter out the empty `site` and persist a BARE `admin` membership =
	// unscoped project-admin — a grant the direct add-member path rejects as VARIABLE_EMPTY. The runtime
	// backstop re-validates the membership AS WRITTEN against the live ACL and DROPS it: no membership SQL
	// runs, sign-in still succeeds (fail-open), audited with the idp_role_mapping_failed marker.
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const sessionProjectId = testUuid(10)
	const mappedProjectId = testUuid(30)
	const apiKeyId = testUuid(1)
	const idpId = testUuid(20)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		projectSchemaResolver: adminWithRequiredVariableResolver,
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
							// the match claim is present (rule fires), but `site_id` (the variable source) is absent,
							// so the scoping `site` variable resolves to no values
							claims: { department: 'Editorial' },
							claimMapping: {
								rules: [
									{
										claim: 'department',
										equals: 'Editorial',
										grantMembership: { project: 'demo', role: 'admin', variables: [{ name: 'site', from: { claim: 'site_id' } }] },
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
				// the rule is config-valid (kept in the vocabulary), so the before/after snapshot still runs for
				// the project — but the EVALUATED `admin` grant is dropped, so NO membership write happens
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [] }),
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
				type: 'idp_role_mapping_failed',
				response: expect.objectContaining({ ok: true }),
				personId,
				targetPersonId: personId,
				identityProviderId: idpId,
			},
		],
	})
})

test('SEC: a legitimate `admin` grant (role has no required variable) is still applied — the guard does not over-drop', async () => {
	// Positive control for the runtime backstop above: an `admin` role with NO variables is the conventional
	// unrestricted admin, and granting it via A09 is legitimate (there is no required variable to be missing).
	// The backstop must leave it alone — the membership is written and audited as mapped.
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const sessionProjectId = testUuid(10)
	const mappedProjectId = testUuid(30)
	// uuid() is global+incrementing: the membership insert consumes #1, the session key #2.
	const membershipId = testUuid(1)
	const apiKeyId = testUuid(2)
	const idpId = testUuid(20)
	const project = mappedProject(mappedProjectId)
	await executeTenantTest({
		projectSchemaResolver: adminWithoutVariablesResolver,
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
									{ claim: 'department', equals: 'Editorial', grantMembership: { project: 'demo', role: 'admin' } },
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
				// apply: resolve project, insert the `admin` membership (no variable to write, none dropped)
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				createMembershipSql({ membershipId, identityId, projectId: mappedProjectId, role: 'admin' }),
				// after snapshot
				getProjectBySlugSql({ projectSlug: 'demo', response: project }),
				selectMembershipsSql({ identityId, projectId: mappedProjectId, membershipsResponse: [{ role: 'admin', variables: [] }] }),
				getConfigSql(),
				getIdentityByIdSql({ identityId }),
				getAuthPoliciesSql(),
				createSessionKeySql({ apiKeyId, identityId }),
			),
			getIdentityProjectsSql({ identityId, projectId: sessionProjectId }),
			selectMembershipsSql({ identityId, projectId: sessionProjectId, membershipsResponse: [{ role: 'admin', variables: [] }] }),
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
					after: { memberships: [{ project: 'demo', role: 'admin', variables: [] }] },
					syncPolicy: 'always',
					unmatched: 'keep',
				},
			},
		],
	})
})
