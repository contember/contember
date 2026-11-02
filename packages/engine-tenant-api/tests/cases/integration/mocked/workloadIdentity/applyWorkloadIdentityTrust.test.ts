import { describe, expect, test } from 'bun:test'
import { AuthorizationScope } from '@contember/authorization'
import { authenticatedIdentityId, executeTenantTest } from '../../../../src/testTenant.js'
import { testUuid } from '../../../../src/testUuid.js'
import { GQL, SQL } from '../../../../src/tags.js'
import { getProjectBySlugSql } from '../sql/getProjectBySlugSql.js'
import { sqlTransaction } from '../sql/sqlTransaction.js'
import { createIdentitySql } from '../sql/createIdentitySql.js'
import { createMembershipSql } from '../sql/createMembershipSql.js'
import { createMembershipVariableSql } from '../sql/createMembershipVariableSql.js'
import { AuthCredential, PermissionActions } from '../../../../../src/index.js'
import {
	createTrustSql,
	defaultTrustColumns,
	deleteAssumeRulesSql,
	disableTrustSql,
	insertAssumeRuleSql,
	trustByIdSql,
	trustBySlugSql,
	trustDbRow,
	trustMembershipsSql,
	updateIdentitySql,
	updateTrustSql,
} from './workloadIdentitySql.js'

const workloadCredential: AuthCredential = { type: 'workload_trust', trustId: testUuid(900), trustSlug: 'ci', tokenRef: 'jti-1' }

const applyMutation = (slug: string, trust: object) => ({
	query: GQL`mutation($slug: String!, $trust: WorkloadIdentityTrustInput!) {
		applyWorkloadIdentityTrust(slug: $slug, trust: $trust) {
			ok
			error { code developerMessage details }
			result {
				created
				tokensValidAfterBumped
				envelopeClosure
				trust { slug profile disabled roles memberships { project role variables { name values } assumeMembership } }
			}
		}
	}`,
	variables: { slug, trust },
})

const disableMutation = (slug: string) => ({
	query: GQL`mutation($slug: String!) {
		disableWorkloadIdentityTrust(slug: $slug) {
			ok
			error { code }
		}
	}`,
	variables: { slug },
})

const baseInput = {
	profile: 'oidc',
	issuer: 'https://auth.example.com',
	audience: 'contember:test:web',
	conditions: [{ claim: 'sub', equals: 'web-backend' }],
}

const slug = 'web'
const identityId = testUuid(70)
const trustId = testUuid(71)
const projectId = testUuid(50)
const membershipId = testUuid(72)
const project = { id: projectId, name: 'Blog', slug: 'blog', config: {} }
const language = { name: 'language', values: ['cs'] }

const snapshot = (overrides: Record<string, unknown> = {}) => ({
	id: trustId,
	slug,
	identityId,
	profile: 'oidc',
	issuer: 'https://auth.example.com',
	audience: 'contember:test:web',
	jwksUri: null,
	signingAlgs: ['ES256', 'RS256'],
	acceptedTyp: ['JWT', null],
	acceptAudienceArray: false,
	requireDpop: false,
	conditions: [{ claim: 'sub', equals: 'web-backend' }],
	maxTokenLifetime: 3600,
	trustForwardedInfo: false,
	description: null,
	disabled: false,
	roles: [],
	memberships: [],
	...overrides,
})

describe('applyWorkloadIdentityTrust', () => {
	test('creates the identity, the trust, its membership and the envelope rule', async () => {
		const createdIdentityId = testUuid(1)
		const createdTrustId = testUuid(2)
		const createdMembershipId = testUuid(3)
		const rule = { reviewer: {} }
		const storedMembership = {
			id: createdMembershipId,
			identityId: createdIdentityId,
			projectId,
			projectSlug: 'blog',
			role: 'editor',
			variables: [language],
		}
		const envelopeClosure = [{
			project: 'blog',
			membership: { role: 'editor', variables: [language] },
			targets: [{ role: 'reviewer', variables: {}, unbounded: false, sensitiveFlags: [] }],
		}]
		await executeTenantTest({
			query: applyMutation(slug, {
				...baseInput,
				description: 'Website backend',
				memberships: [{ project: 'blog', role: 'editor', variables: [language], assumeMembership: rule }],
			}),
			executes: [
				trustBySlugSql(slug, []),
				getProjectBySlugSql({ projectSlug: 'blog', response: project }),
				...sqlTransaction(
					trustBySlugSql(slug, []),
					createIdentitySql({ identityId: createdIdentityId, roles: [], description: 'Website backend' }),
					createTrustSql({ id: createdTrustId, slug, identityId: createdIdentityId, createdBy: authenticatedIdentityId }),
					createMembershipSql({ membershipId: createdMembershipId, projectId, identityId: createdIdentityId, role: 'editor' }),
					createMembershipVariableSql({ variableId: testUuid(4), membershipId: createdMembershipId, variableName: 'language', values: ['cs'] }),
					trustMembershipsSql([createdIdentityId], [{ ...storedMembership, rule: null }]),
					deleteAssumeRulesSql(createdTrustId),
					insertAssumeRuleSql({ id: testUuid(5), trustId: createdTrustId, membershipId: createdMembershipId, rule }),
					trustByIdSql(createdTrustId, [
						trustDbRow({ id: createdTrustId, slug, identity_id: createdIdentityId, description: 'Website backend' }),
					]),
					trustMembershipsSql([createdIdentityId], [{ ...storedMembership, rule }]),
				),
			],
			return: {
				data: {
					applyWorkloadIdentityTrust: {
						ok: true,
						error: null,
						result: {
							created: true,
							tokensValidAfterBumped: false,
							envelopeClosure,
							trust: {
								slug,
								profile: 'oidc',
								disabled: false,
								roles: [],
								memberships: [{ project: 'blog', role: 'editor', variables: [language], assumeMembership: rule }],
							},
						},
					},
				},
			},
			expectedAuthLog: {
				type: 'workload_identity_apply',
				response: { ok: true, result: null },
				trustId: createdTrustId,
				eventData: {
					slug,
					trustId: createdTrustId,
					created: true,
					tokensValidAfterBumped: false,
					before: null,
					after: {
						...snapshot({
							id: createdTrustId,
							identityId: createdIdentityId,
							description: 'Website backend',
							memberships: [{ project: 'blog', role: 'editor', variables: [language], assumeMembership: rule }],
						}),
						envelopeClosure,
					},
				},
			},
		})
	})

	test('an unchanged re-apply does not bump tokens_valid_after', async () => {
		const rule = { reviewer: {} }
		const stored = { id: membershipId, identityId, projectId, projectSlug: 'blog', role: 'editor', variables: [language], rule }
		const row = trustDbRow({ id: trustId, slug, identity_id: identityId })
		await executeTenantTest({
			query: applyMutation(slug, {
				...baseInput,
				memberships: [{ project: 'blog', role: 'editor', variables: [language], assumeMembership: rule }],
			}),
			executes: [
				trustBySlugSql(slug, [row]),
				getProjectBySlugSql({ projectSlug: 'blog', response: project }),
				...sqlTransaction(
					trustBySlugSql(slug, [row]),
					trustMembershipsSql([identityId], [stored]),
					updateIdentitySql({ identityId, roles: [], description: null }),
					updateTrustSql({ id: trustId, bump: false }),
					deleteAssumeRulesSql(trustId),
					insertAssumeRuleSql({ id: testUuid(1), trustId, membershipId, rule }),
					trustByIdSql(trustId, [row]),
					trustMembershipsSql([identityId], [stored]),
				),
			],
			return: {
				data: {
					applyWorkloadIdentityTrust: {
						ok: true,
						error: null,
						result: {
							created: false,
							tokensValidAfterBumped: false,
							envelopeClosure: [{
								project: 'blog',
								membership: { role: 'editor', variables: [language] },
								targets: [{ role: 'reviewer', variables: {}, unbounded: false, sensitiveFlags: [] }],
							}],
							trust: {
								slug,
								profile: 'oidc',
								disabled: false,
								roles: [],
								memberships: [{ project: 'blog', role: 'editor', variables: [language], assumeMembership: rule }],
							},
						},
					},
				},
			},
			expectedAuthLog: {
				type: 'workload_identity_apply',
				response: { ok: true, result: null },
				trustId,
				eventData: {
					slug,
					trustId,
					created: false,
					tokensValidAfterBumped: false,
					before: snapshot({ memberships: [{ project: 'blog', role: 'editor', variables: [language], assumeMembership: rule }] }),
					after: {
						...snapshot({ memberships: [{ project: 'blog', role: 'editor', variables: [language], assumeMembership: rule }] }),
						envelopeClosure: [{
							project: 'blog',
							membership: { role: 'editor', variables: [language] },
							targets: [{ role: 'reviewer', variables: {}, unbounded: false, sensitiveFlags: [] }],
						}],
					},
				},
			},
		})
	})

	const updateTest = async (args: {
		row: ReturnType<typeof trustDbRow>
		input: object
		columns: typeof defaultTrustColumns
		roles: string[]
		bump: boolean
		afterRow: ReturnType<typeof trustDbRow>
	}) => {
		await executeTenantTest({
			query: applyMutation(slug, args.input),
			executes: [
				trustBySlugSql(slug, [args.row]),
				...sqlTransaction(
					trustBySlugSql(slug, [args.row]),
					trustMembershipsSql([identityId], []),
					updateIdentitySql({ identityId, roles: args.roles, description: null }),
					updateTrustSql({ id: trustId, bump: args.bump, columns: args.columns }),
					trustByIdSql(trustId, [args.afterRow]),
					trustMembershipsSql([identityId], []),
				),
			],
			return: {
				data: {
					applyWorkloadIdentityTrust: {
						ok: true,
						error: null,
						result: {
							created: false,
							tokensValidAfterBumped: args.bump,
							envelopeClosure: [],
							trust: { slug, profile: 'oidc', disabled: false, roles: args.afterRow.roles, memberships: [] },
						},
					},
				},
			},
			expectedAuthLog: {
				type: 'workload_identity_apply',
				response: { ok: true, result: null },
				trustId,
				eventData: expect.objectContaining({ tokensValidAfterBumped: args.bump }),
			},
		})
	}

	test('a condition change bumps tokens_valid_after', async () => {
		const conditions = [{ claim: 'sub', equals: 'web-backend' }, { claim: 'env', equals: 'prod' }]
		await updateTest({
			row: trustDbRow({ id: trustId, slug, identity_id: identityId }),
			input: { ...baseInput, conditions },
			columns: { ...defaultTrustColumns, conditions },
			roles: [],
			bump: true,
			afterRow: trustDbRow({ id: trustId, slug, identity_id: identityId, conditions }),
		})
	})

	test('a dry run performs the apply, rolls it back and writes no audit row', async () => {
		const conditions = [{ claim: 'sub', equals: 'web-backend' }, { claim: 'env', equals: 'prod' }]
		const row = trustDbRow({ id: trustId, slug, identity_id: identityId })
		await executeTenantTest({
			query: {
				query: GQL`mutation($slug: String!, $trust: WorkloadIdentityTrustInput!) {
					applyWorkloadIdentityTrust(slug: $slug, trust: $trust, dryRun: true) {
						ok
						result { created tokensValidAfterBumped trust { slug } }
					}
				}`,
				variables: { slug, trust: { ...baseInput, conditions } },
			},
			executes: [
				trustBySlugSql(slug, [row]),
				{ sql: SQL`BEGIN;`, response: { rowCount: 1 } },
				{ sql: SQL`SET TRANSACTION ISOLATION LEVEL REPEATABLE READ`, response: { rowCount: 1 } },
				trustBySlugSql(slug, [row]),
				trustMembershipsSql([identityId], []),
				updateIdentitySql({ identityId, roles: [], description: null }),
				updateTrustSql({ id: trustId, bump: true, columns: { ...defaultTrustColumns, conditions } }),
				trustByIdSql(trustId, [trustDbRow({ id: trustId, slug, identity_id: identityId, conditions })]),
				trustMembershipsSql([identityId], []),
				{ sql: SQL`ROLLBACK;`, response: { rowCount: 1 } },
			],
			return: {
				data: {
					applyWorkloadIdentityTrust: { ok: true, result: { created: false, tokensValidAfterBumped: true, trust: { slug } } },
				},
			},
		})
	})

	test('a grant or lifetime change does not bump tokens_valid_after', async () => {
		await updateTest({
			row: trustDbRow({ id: trustId, slug, identity_id: identityId }),
			input: { ...baseInput, roles: ['entrypoint_deployer'], maxTokenLifetime: 600, signingAlgs: ['RS256', 'ES256'] },
			columns: { ...defaultTrustColumns, maxTokenLifetime: 600 },
			roles: ['entrypoint_deployer'],
			bump: false,
			afterRow: trustDbRow({ id: trustId, slug, identity_id: identityId, roles: ['entrypoint_deployer'], max_token_lifetime_seconds: 600 }),
		})
	})

	test('re-enabling a disabled trust bumps tokens_valid_after', async () => {
		await updateTest({
			row: trustDbRow({ id: trustId, slug, identity_id: identityId, disabled: true }),
			input: { ...baseInput, disabled: false },
			columns: defaultTrustColumns,
			roles: [],
			bump: true,
			afterRow: trustDbRow({ id: trustId, slug, identity_id: identityId }),
		})
	})

	test('a caller authenticated through a trust may not apply or disable trusts', async () => {
		await executeTenantTest({
			query: applyMutation(slug, baseInput),
			callerCredential: workloadCredential,
			executes: [],
			return: {
				data: { applyWorkloadIdentityTrust: { ok: false, error: expect.objectContaining({ code: 'WORKLOAD_CREDENTIAL_FORBIDDEN' }), result: null } },
			},
		})
		await executeTenantTest({
			query: disableMutation(slug),
			callerCredential: workloadCredential,
			executes: [],
			return: { data: { disableWorkloadIdentityTrust: { ok: false, error: { code: 'WORKLOAD_CREDENTIAL_FORBIDDEN' } } } },
		})
	})

	test('a project_admin applier cannot grant super_admin', async () => {
		await executeTenantTest({
			query: applyMutation(slug, { ...baseInput, roles: ['super_admin'] }),
			identityRoles: ['project_admin'],
			executes: [trustBySlugSql(slug, [])],
			return: { data: { applyWorkloadIdentityTrust: { ok: false, error: expect.objectContaining({ code: 'ROLE_NOT_ALLOWED' }), result: null } } },
		})
	})

	test('a project_admin applier cannot rewrite a trust holding super_admin', async () => {
		await executeTenantTest({
			query: applyMutation(slug, baseInput),
			identityRoles: ['project_admin'],
			executes: [trustBySlugSql(slug, [trustDbRow({ id: trustId, slug, identity_id: identityId, roles: ['super_admin'] })])],
			return: { data: { applyWorkloadIdentityTrust: { ok: false, error: expect.objectContaining({ code: 'ROLE_NOT_ALLOWED' }), result: null } } },
		})
	})

	test('a trust created after the caller was authorized for a create answers CONFLICT', async () => {
		await executeTenantTest({
			query: applyMutation(slug, baseInput),
			executes: [
				trustBySlugSql(slug, []),
				...sqlTransaction(
					trustBySlugSql(slug, [trustDbRow({ id: trustId, slug, identity_id: identityId, roles: ['super_admin'] })]),
					trustMembershipsSql([identityId], []),
				),
			],
			return: { data: { applyWorkloadIdentityTrust: { ok: false, error: expect.objectContaining({ code: 'CONFLICT' }), result: null } } },
		})
	})

	test('login is refused on a trust, even for a super_admin', async () => {
		await executeTenantTest({
			query: applyMutation(slug, { ...baseInput, roles: ['login'] }),
			identityRoles: ['super_admin'],
			executes: [trustBySlugSql(slug, [])],
			return: { data: { applyWorkloadIdentityTrust: { ok: false, error: expect.objectContaining({ code: 'ROLE_NOT_ALLOWED' }), result: null } } },
		})
	})

	test('an implicit admin role together with memberships is rejected', async () => {
		await executeTenantTest({
			query: applyMutation(slug, { ...baseInput, roles: ['project_admin'], memberships: [{ project: 'blog', role: 'reviewer' }] }),
			executes: [trustBySlugSql(slug, [])],
			return: {
				data: { applyWorkloadIdentityTrust: { ok: false, error: expect.objectContaining({ code: 'IMPLICIT_MEMBERSHIP_CONFLICT' }), result: null } },
			},
		})
	})

	test('an unbounded envelope rule needs global authority to add members', async () => {
		// allows everything except adding members outside a project scope
		const authorizator = {
			isAllowed: (identity: unknown, scope: unknown, action: { resource: string; privilege: string }) =>
				Promise.resolve(
					!(scope instanceof AuthorizationScope.Global
						&& action.resource === PermissionActions.PROJECT_ADD_MEMBER([]).resource
						&& action.privilege === PermissionActions.PROJECT_ADD_MEMBER([]).privilege),
				),
		}
		await executeTenantTest({
			query: applyMutation(slug, {
				...baseInput,
				memberships: [{ project: 'blog', role: 'editor', variables: [language], assumeMembership: { reviewer: true } }],
			}),
			authorizator,
			executes: [trustBySlugSql(slug, []), getProjectBySlugSql({ projectSlug: 'blog', response: project })],
			return: {
				data: {
					applyWorkloadIdentityTrust: {
						ok: false,
						error: expect.objectContaining({
							code: 'ENVELOPE_NOT_AUTHORIZED',
							details: [{ project: 'blog', membershipRole: 'editor', role: 'reviewer' }],
						}),
						result: null,
					},
				},
			},
		})
	})

	test('an envelope rule targeting a role missing from the schema is rejected per rule', async () => {
		await executeTenantTest({
			query: applyMutation(slug, {
				...baseInput,
				memberships: [{ project: 'blog', role: 'editor', variables: [language], assumeMembership: { admin: true } }],
			}),
			executes: [trustBySlugSql(slug, []), getProjectBySlugSql({ projectSlug: 'blog', response: project })],
			return: {
				data: {
					applyWorkloadIdentityTrust: {
						ok: false,
						error: expect.objectContaining({
							code: 'INVALID_ENVELOPE',
							details: [{ project: 'blog', membershipRole: 'editor', role: 'admin', variable: null, message: 'role is not defined in the project schema' }],
						}),
						result: null,
					},
				},
			},
		})
	})

	test('a membership in a missing project is rejected', async () => {
		await executeTenantTest({
			query: applyMutation(slug, { ...baseInput, memberships: [{ project: 'nope', role: 'reviewer' }] }),
			executes: [trustBySlugSql(slug, []), getProjectBySlugSql({ projectSlug: 'nope', response: null })],
			return: {
				data: { applyWorkloadIdentityTrust: { ok: false, error: expect.objectContaining({ code: 'PROJECT_NOT_FOUND' }), result: null } },
			},
		})
	})
})

describe('disableWorkloadIdentityTrust', () => {
	test('disables the trust', async () => {
		await executeTenantTest({
			query: disableMutation(slug),
			executes: [disableTrustSql(slug, trustId)],
			return: { data: { disableWorkloadIdentityTrust: { ok: true, error: null } } },
			expectedAuthLog: {
				type: 'workload_identity_disable',
				response: { ok: true, result: null },
				trustId,
				eventData: { slug, trustId },
			},
		})
	})

	test('reports an unknown slug', async () => {
		await executeTenantTest({
			query: disableMutation(slug),
			executes: [disableTrustSql(slug, null)],
			return: { data: { disableWorkloadIdentityTrust: { ok: false, error: { code: 'NOT_FOUND' } } } },
		})
	})
})
