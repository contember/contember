import { expect, test } from 'bun:test'
import { apiUrl, consumeMails, createTester, executeGraphql, rand, rootToken } from '../../src/tester.js'
import { emptySchema } from '@contember/schema-utils'
import { TenantConfigApplier } from '../../../packages/cli/src/lib/tenant/TenantConfigApplier.js'
import { TenantClient as ProvisioningTenantClient } from '../../../packages/cli/src/lib/tenant/TenantClient.js'

const meQuery = `query { me { id } }`
const meRolesQuery = `query { me { roles } }`
const personIdQuery = `query { me { person { id } } }`

const createCustomRoleMutation = `mutation($slug: String!, $grants: [CustomRoleGrantInput!]!, $description: String) {
	createCustomRole(slug: $slug, grants: $grants, description: $description) { ok error { code } }
}`

const updateCustomRoleMutation = `mutation($slug: String!, $grants: [CustomRoleGrantInput!]) {
	updateCustomRole(slug: $slug, grants: $grants) { ok error { code } }
}`

const deleteCustomRoleMutation = `mutation($slug: String!) {
	deleteCustomRole(slug: $slug) { ok error { code } }
}`

const customRolesQuery = `query { customRoles { slug description grants { permission config } } }`

const grantRolesMutation = `mutation($identityId: String!, $roles: [String!]!) {
	addGlobalIdentityRoles(identityId: $identityId, roles: $roles) { ok error { code } }
}`

const forceSignOutMutation = `mutation($id: String!) {
	forceSignOutPerson(personId: $id) { ok error { code } }
}`

const removeRolesMutation = `mutation($identityId: String!, $roles: [String!]!) {
	removeGlobalIdentityRoles(identityId: $identityId, roles: $roles) { ok error { code } }
}`

test('tenant config applier provisions typed custom roles', async () => {
	const managerRole = `provisioned_manager_${rand()}`
	const workerRole = `provisioned_worker_${rand()}`
	const client = ProvisioningTenantClient.create(apiUrl, rootToken)
	const applier = new TenantConfigApplier()

	await applier.apply(client, {
		customRoles: {
			[managerRole]: {
				description: 'Provisioned manager',
				grants: [{
					permission: 'identity:addGlobalRoles',
					config: {
						roles: { allowed: [workerRole] },
						target: {
							globalRoles: { allowed: ['person'] },
							projectMemberships: 'none',
						},
						allowSelf: false,
					},
				}],
			},
			[workerRole]: {
				description: 'Provisioned worker',
				grants: [{ permission: 'person:view' }],
			},
		},
	})

	const created = await executeGraphql('/tenant', customRolesQuery, {})
	expect(created.body.data.customRoles).toContainEqual({
		slug: managerRole,
		description: 'Provisioned manager',
		grants: [{
			permission: 'identity:addGlobalRoles',
			config: {
				roles: { allowed: [workerRole] },
				target: {
					globalRoles: { allowed: ['person'] },
					projectMemberships: 'none',
				},
				allowSelf: false,
			},
		}],
	})

	await applier.apply(client, {
		customRoles: {
			[managerRole]: {
				description: 'Updated manager',
				grants: [{ permission: 'person:list' }],
			},
		},
	})

	const updated = await executeGraphql('/tenant', customRolesQuery, {})
	expect(updated.body.data.customRoles).toContainEqual({
		slug: managerRole,
		description: 'Updated manager',
		grants: [{ permission: 'person:list', config: null }],
	})
	expect(updated.body.data.customRoles).toContainEqual({
		slug: workerRole,
		description: 'Provisioned worker',
		grants: [{ permission: 'person:view', config: null }],
	})

	// an explicit null clears the description — the typed fetcher cannot express it,
	// so this is the only coverage of TenantClient's raw-document fallback
	await applier.apply(client, {
		customRoles: {
			[managerRole]: {
				description: null,
				grants: [{ permission: 'person:list' }],
			},
		},
	})

	const cleared = await executeGraphql('/tenant', customRolesQuery, {})
	expect(cleared.body.data.customRoles).toContainEqual({
		slug: managerRole,
		description: null,
		grants: [{ permission: 'person:list', config: null }],
	})
})

test('custom role grants its permission bundle at runtime', async () => {
	const tester = await createTester(emptySchema)
	const slug = `support_${rand()}`
	const password = 'HWGA51KKpJ4lSW'

	// support person + target person
	const supportEmail = `support-${rand()}@doe.com`
	const targetEmail = `target-${rand()}@doe.com`
	const supportIdentityId = await tester.tenant.signUp(supportEmail, password)
	await tester.tenant.signUp(targetEmail, password)
	const supportToken = await tester.tenant.signIn(supportEmail, password)
	const targetToken = await tester.tenant.signIn(targetEmail, password)

	const targetPersonResp = await executeGraphql('/tenant', personIdQuery, { authorizationToken: targetToken })
	const targetPersonId: string = targetPersonResp.body.data.me.person.id

	// without the role, support cannot force sign out
	const deniedResp = await executeGraphql('/tenant', forceSignOutMutation, {
		authorizationToken: supportToken,
		variables: { id: targetPersonId },
	})
	expect(deniedResp.body.errors?.[0]?.message).toMatch(/not allowed/i)

	// super admin defines the role and assigns it
	const createResp = await executeGraphql('/tenant', createCustomRoleMutation, {
		variables: {
			slug,
			grants: [
				{
					permission: 'person:forceSignOut',
					config: {
						target: {
							globalRoles: { allowed: ['person'] },
							projectMemberships: 'any',
						},
					},
				},
				{ permission: 'customRole:view' },
			],
			description: 'Support team',
		},
	})
	expect(createResp.body).toEqual({ data: { createCustomRole: { ok: true, error: null } } })

	const grantResp = await executeGraphql('/tenant', grantRolesMutation, {
		variables: { identityId: supportIdentityId, roles: [slug] },
	})
	expect(grantResp.body.data.addGlobalIdentityRoles.ok).toBe(true)

	// the bundle applies on the next request — no re-login
	const allowedResp = await executeGraphql('/tenant', forceSignOutMutation, {
		authorizationToken: supportToken,
		variables: { id: targetPersonId },
	})
	expect(allowedResp.body.data.forceSignOutPerson).toEqual({ ok: true, error: null })
	await executeGraphql('/tenant', meQuery, { authorizationToken: targetToken }).expect(401)

	// the forced-sign-out notification mail
	const mails = await consumeMails()
	expect(mails).toHaveLength(1)
	expect(mails[0].Content.Headers.To?.[0]).toBe(targetEmail)

	// customRole:view in the bundle lets support read the definitions
	const listResp = await executeGraphql('/tenant', customRolesQuery, { authorizationToken: supportToken })
	expect(listResp.body.data.customRoles).toContainEqual(
		{
			slug,
			description: 'Support team',
			grants: [
				{ permission: 'customRole:view', config: null },
				{
					permission: 'person:forceSignOut',
					config: {
						target: {
							globalRoles: { allowed: ['person'] },
							projectMemberships: 'any',
						},
					},
				},
			],
		},
	)

	// narrowing the bundle applies immediately as well
	const updateResp = await executeGraphql('/tenant', updateCustomRoleMutation, {
		variables: { slug, grants: [{ permission: 'customRole:view' }] },
	})
	expect(updateResp.body.data.updateCustomRole.ok).toBe(true)

	const deniedAgainResp = await executeGraphql('/tenant', forceSignOutMutation, {
		authorizationToken: supportToken,
		variables: { id: targetPersonId },
	})
	expect(deniedAgainResp.body.errors?.[0]?.message).toMatch(/not allowed/i)

	// deletion drops the definition and strips the assignment in the same transaction
	const deleteResp = await executeGraphql('/tenant', deleteCustomRoleMutation, { variables: { slug } })
	expect(deleteResp.body.data.deleteCustomRole.ok).toBe(true)

	const rolesAfterDelete = await executeGraphql('/tenant', meRolesQuery, { authorizationToken: supportToken })
	expect(rolesAfterDelete.body.data.me.roles).not.toContain(slug)
	// the whole array survives — a regression in the raw jsonb update would wipe it
	expect(rolesAfterDelete.body.data.me.roles).toContain('person')

	const listDeniedResp = await executeGraphql('/tenant', customRolesQuery, { authorizationToken: supportToken })
	expect(listDeniedResp.body.errors?.[0]?.message).toMatch(/not allowed/i)

	// the slug is free again, and recreating it does NOT resurrect the stripped assignment
	const recreateResp = await executeGraphql('/tenant', createCustomRoleMutation, {
		variables: { slug, grants: [{ permission: 'customRole:view' }] },
	})
	expect(recreateResp.body.data.createCustomRole.ok).toBe(true)

	const stillDeniedResp = await executeGraphql('/tenant', customRolesQuery, { authorizationToken: supportToken })
	expect(stillDeniedResp.body.errors?.[0]?.message).toMatch(/not allowed/i)

	const conflictResp = await executeGraphql('/tenant', createCustomRoleMutation, {
		variables: { slug, grants: [{ permission: 'customRole:view' }] },
	})
	expect(conflictResp.body.data.createCustomRole.error.code).toBe('SLUG_ALREADY_EXISTS')
})

test('configured grants cannot weaken protected-role restrictions', async () => {
	const tester = await createTester(emptySchema)
	const slug = `support_${rand()}`
	const password = 'HWGA51KKpJ4lSW'

	// Powerful v1 grants are explicit and require their action-specific configuration.
	const invalidResp = await executeGraphql('/tenant', createCustomRoleMutation, {
		variables: { slug, grants: [{ permission: 'identity:addGlobalRoles' }] },
	})
	expect(invalidResp.body.data.createCustomRole.ok).toBe(false)
	expect(invalidResp.body.data.createCustomRole.error.code).toBe('INVALID_PERMISSION_CONFIGURATION')

	// support person with the force-sign-out bundle
	const supportEmail = `support-${rand()}@doe.com`
	const adminEmail = `admin-${rand()}@doe.com`
	const supportIdentityId = await tester.tenant.signUp(supportEmail, password)
	const adminIdentityId = await tester.tenant.signUp(adminEmail, password)
	const supportToken = await tester.tenant.signIn(supportEmail, password)
	const adminToken = await tester.tenant.signIn(adminEmail, password)

	const createResp = await executeGraphql('/tenant', createCustomRoleMutation, {
		variables: {
			slug,
			grants: [{
				permission: 'person:forceSignOut',
				config: {
					target: {
						globalRoles: { allowed: ['person'] },
						projectMemberships: 'any',
					},
				},
			}],
		},
	})
	expect(createResp.body.data.createCustomRole.ok).toBe(true)
	const grantResp = await executeGraphql('/tenant', grantRolesMutation, {
		variables: { identityId: supportIdentityId, roles: [slug] },
	})
	expect(grantResp.body.data.addGlobalIdentityRoles.ok).toBe(true)

	// the other person becomes a super_admin — now off-limits for the custom role
	const grantAdminResp = await executeGraphql('/tenant', grantRolesMutation, {
		variables: { identityId: adminIdentityId, roles: ['super_admin'] },
	})
	expect(grantAdminResp.body.data.addGlobalIdentityRoles.ok).toBe(true)

	const adminPersonResp = await executeGraphql('/tenant', personIdQuery, { authorizationToken: adminToken })
	const adminPersonId: string = adminPersonResp.body.data.me.person.id

	const deniedResp = await executeGraphql('/tenant', forceSignOutMutation, {
		authorizationToken: supportToken,
		variables: { id: adminPersonId },
	})
	expect(deniedResp.body.errors?.[0]?.message).toMatch(/not allowed/i)
	await executeGraphql('/tenant', meQuery, { authorizationToken: adminToken }).expect(200)
})

test('configured v1 grants work through the complete GraphQL authorization path', async () => {
	const tester = await createTester(emptySchema)
	const managerRole = `manager_${rand()}`
	const workerRole = `worker_${rand()}`
	const password = 'HWGA51KKpJ4lSW'
	const changedPassword = 'A5mJ9vQr2xLp7zN'
	const supportEmail = `manager-${rand()}@doe.com`
	const targetEmail = `managed-${rand()}@doe.com`
	const supportIdentityId = await tester.tenant.signUp(supportEmail, password)
	const targetIdentityId = await tester.tenant.signUp(targetEmail, password)
	const supportToken = await tester.tenant.signIn(supportEmail, password)
	const targetToken = await tester.tenant.signIn(targetEmail, password)
	const targetPersonResp = await executeGraphql('/tenant', personIdQuery, { authorizationToken: targetToken })
	const targetPersonId: string = targetPersonResp.body.data.me.person.id

	const workerResp = await executeGraphql('/tenant', createCustomRoleMutation, {
		variables: {
			slug: workerRole,
			grants: [{ permission: 'person:view' }],
		},
	})
	expect(workerResp.body.data.createCustomRole.ok).toBe(true)

	const target = {
		globalRoles: { allowed: ['person', workerRole] },
		projectMemberships: 'any',
	}
	const createManagerResp = await executeGraphql('/tenant', createCustomRoleMutation, {
		variables: {
			slug: managerRole,
			grants: [
				{ permission: 'person:changePassword', config: { target } },
				{
					permission: 'person:changeProfile',
					config: { target, fields: { allowed: ['name'] } },
				},
				{
					permission: 'person:createSessionToken',
					config: {
						target,
						session: { maxExpirationMinutes: 30, allowTrustForwardedClientInfo: false },
					},
				},
				{
					permission: 'identity:addGlobalRoles',
					config: {
						roles: { allowed: [workerRole] },
						target,
						allowSelf: false,
					},
				},
				{
					permission: 'identity:removeGlobalRoles',
					config: {
						roles: { allowed: [workerRole] },
						target,
						allowSelf: false,
					},
				},
				{
					permission: 'apiKey:createGlobal',
					config: {
						roles: { allowed: [workerRole] },
						allowTrustForwardedClientInfo: false,
					},
				},
				{
					permission: 'mailTemplate:add',
					config: { global: false, projects: [tester.projectSlug], types: ['FORCED_SIGN_OUT'] },
				},
				{
					permission: 'mailTemplate:remove',
					config: { global: false, projects: [tester.projectSlug], types: ['FORCED_SIGN_OUT'] },
				},
				{
					permission: 'mailTemplate:list',
					config: { global: false, projects: [tester.projectSlug], types: ['FORCED_SIGN_OUT'] },
				},
			],
		},
	})
	expect(createManagerResp.body.data.createCustomRole.ok).toBe(true)

	const assignManagerResp = await executeGraphql('/tenant', grantRolesMutation, {
		variables: { identityId: supportIdentityId, roles: [managerRole] },
	})
	expect(assignManagerResp.body.data.addGlobalIdentityRoles.ok).toBe(true)

	const profileResp = await executeGraphql(
		'/tenant',
		`mutation($id: String!) { changeProfile(personId: $id, name: "Managed") { ok error { code } } }`,
		{ authorizationToken: supportToken, variables: { id: targetPersonId } },
	)
	expect(profileResp.body.data.changeProfile.ok).toBe(true)

	const deniedEmailResp = await executeGraphql(
		'/tenant',
		`mutation($id: String!) { changeProfile(personId: $id, email: "forbidden@example.com") { ok } }`,
		{ authorizationToken: supportToken, variables: { id: targetPersonId } },
	)
	expect(deniedEmailResp.body.errors?.[0]?.message).toMatch(/not allowed/i)

	const passwordResp = await executeGraphql(
		'/tenant',
		`mutation($id: String!, $password: String!) { changePassword(personId: $id, password: $password) { ok } }`,
		{ authorizationToken: supportToken, variables: { id: targetPersonId, password: changedPassword } },
	)
	expect(passwordResp.body.data.changePassword.ok).toBe(true)
	await tester.tenant.signIn(targetEmail, changedPassword)

	const sessionResp = await executeGraphql(
		'/tenant',
		`mutation($id: String!) {
			createSessionToken(personId: $id, expiration: 15) { ok error { code } result { token } }
		}`,
		{ authorizationToken: supportToken, variables: { id: targetPersonId } },
	)
	expect(sessionResp.body.data.createSessionToken.ok).toBe(true)
	const delegatedSession: string = sessionResp.body.data.createSessionToken.result.token
	await executeGraphql('/tenant', meQuery, { authorizationToken: delegatedSession }).expect(200)

	const addWorkerResp = await executeGraphql('/tenant', grantRolesMutation, {
		authorizationToken: supportToken,
		variables: { identityId: targetIdentityId, roles: [workerRole] },
	})
	expect(addWorkerResp.body.data.addGlobalIdentityRoles.ok).toBe(true)
	const rolesAfterAdd = await executeGraphql('/tenant', meRolesQuery, { authorizationToken: delegatedSession })
	expect(rolesAfterAdd.body.data.me.roles).toContain(workerRole)

	const removeWorkerResp = await executeGraphql('/tenant', removeRolesMutation, {
		authorizationToken: supportToken,
		variables: { identityId: targetIdentityId, roles: [workerRole] },
	})
	expect(removeWorkerResp.body.data.removeGlobalIdentityRoles.ok).toBe(true)

	const apiKeyResp = await executeGraphql(
		'/tenant',
		`mutation($roles: [String!]) {
			createGlobalApiKey(description: "delegated", roles: $roles) {
				ok
				error { code }
				result { apiKey { token } }
			}
		}`,
		{ authorizationToken: supportToken, variables: { roles: [workerRole] } },
	)
	expect(apiKeyResp.body.data.createGlobalApiKey.ok).toBe(true)
	const delegatedApiKey: string = apiKeyResp.body.data.createGlobalApiKey.result.apiKey.token
	const apiKeyRoles = await executeGraphql('/tenant', meRolesQuery, { authorizationToken: delegatedApiKey })
	expect(apiKeyRoles.body.data.me.roles).toContain(workerRole)

	const addTemplateResp = await executeGraphql(
		'/tenant',
		`mutation($project: String!) {
			addMailTemplate(template: {
				type: FORCED_SIGN_OUT
				subject: "Delegated template"
				content: "Signed out"
				projectSlug: $project
			}) { ok error { code } }
		}`,
		{ authorizationToken: supportToken, variables: { project: tester.projectSlug } },
	)
	expect(addTemplateResp.body.data.addMailTemplate.ok).toBe(true)

	const listTemplatesResp = await executeGraphql(
		'/tenant',
		`query { mailTemplates { projectSlug type subject } }`,
		{ authorizationToken: supportToken },
	)
	expect(listTemplatesResp.body.data.mailTemplates).toContainEqual({
		projectSlug: tester.projectSlug,
		type: 'FORCED_SIGN_OUT',
		subject: 'Delegated template',
	})

	const removeTemplateResp = await executeGraphql(
		'/tenant',
		`mutation($project: String!) {
			removeMailTemplate(templateIdentifier: { type: FORCED_SIGN_OUT, projectSlug: $project }) { ok error { code } }
		}`,
		{ authorizationToken: supportToken, variables: { project: tester.projectSlug } },
	)
	expect(removeTemplateResp.body.data.removeMailTemplate.ok).toBe(true)

	// The denied half of the same grants. Without these the second, fine-grained
	// requireAccess in GlobalRolesMutationResolver — the only thing enforcing
	// roles.allowed / allowSelf / the target guard — could be deleted with a green suite.
	for (const escalation of ['super_admin', 'project_admin']) {
		const resp = await executeGraphql('/tenant', grantRolesMutation, {
			authorizationToken: supportToken,
			variables: { identityId: targetIdentityId, roles: [escalation] },
		})
		expect(resp.body.errors?.[0]?.message).toMatch(/not allowed/i)
	}

	const selfGrantResp = await executeGraphql('/tenant', grantRolesMutation, {
		authorizationToken: supportToken,
		variables: { identityId: supportIdentityId, roles: [workerRole] },
	})
	expect(selfGrantResp.body.errors?.[0]?.message).toMatch(/not allowed/i)

	const escalatedKeyResp = await executeGraphql(
		'/tenant',
		`mutation($roles: [String!]) { createGlobalApiKey(description: "escalated", roles: $roles) { ok } }`,
		{ authorizationToken: supportToken, variables: { roles: ['super_admin'] } },
	)
	expect(escalatedKeyResp.body.errors?.[0]?.message).toMatch(/not allowed/i)

	// the grant caps the session at 30 minutes
	const longSessionResp = await executeGraphql(
		'/tenant',
		`mutation($id: String!) { createSessionToken(personId: $id, expiration: 60) { ok } }`,
		{ authorizationToken: supportToken, variables: { id: targetPersonId } },
	)
	expect(longSessionResp.body.errors?.[0]?.message).toMatch(/not allowed/i)

	// nothing above leaked through: the target still holds exactly what it was granted
	const rolesAfterDenials = await executeGraphql('/tenant', meRolesQuery, { authorizationToken: delegatedSession })
	expect(rolesAfterDenials.body.data.me.roles).not.toContain('super_admin')
	expect(rolesAfterDenials.body.data.me.roles).not.toContain('project_admin')
	expect(rolesAfterDenials.body.data.me.roles).not.toContain(workerRole)

	const supportRolesAfterDenials = await executeGraphql('/tenant', meRolesQuery, { authorizationToken: supportToken })
	expect(supportRolesAfterDenials.body.data.me.roles).not.toContain(workerRole)
})
