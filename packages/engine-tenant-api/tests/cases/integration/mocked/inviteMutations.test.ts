import { testUuid } from '../../../src/testUuid.js'
import { authenticatedApiKeyId, executeTenantTest } from '../../../src/testTenant.js'
import { inviteMutation } from './gql/invite.js'
import { SQL } from '../../../src/tags.js'
import { patchVariablesSql } from './sql/patchVariablesSql.js'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { createIdentitySql } from './sql/createIdentitySql.js'
import { createMembershipSql } from './sql/createMembershipSql.js'
import { createPersonSql } from './sql/createPersonSql.js'
import { disableOneOffKeySql } from './sql/disableOneOffKeySql.js'
import { test } from 'bun:test'
import { createPersonTokenSql } from './sql/createPersonTokenSql.js'
import { getMailTemplateSql } from './sql/getMailTemplateSql.js'

test('invite a new person', async () => {
	const languageId = testUuid(555)
	const email = 'john@doe.com'
	const identityId = testUuid(1)
	const personId = testUuid(2)
	const membershipId = testUuid(3)
	const variableId = testUuid(4)
	const projectId = testUuid(5)
	const projectSlug = 'blog'

	await executeTenantTest({
		query: inviteMutation({
			email,
			projectSlug,
			memberships: [
				{
					role: 'editor',
					variables: [{ name: 'language', values: [languageId] }],
				},
			],
		}),
		executes: [
			getProjectBySlugSql({
				projectSlug,
				response: { id: projectId, name: projectSlug, slug: projectSlug, config: {} },
			}),
			...sqlTransaction(
				getPersonByEmailSql({ email, response: null }),
				createIdentitySql({ roles: ['person'], identityId }),
				createPersonSql({ identityId, personId, email, password: 'AAAAAAAAAAAA' }),
				createMembershipSql({ membershipId, projectId, identityId, role: 'editor' }),
				patchVariablesSql({
					id: variableId,
					membershipId,
					values: [languageId],
					variableName: 'language',
				}),
				getMailTemplateSql({ projectId, type: 'newUserInvited' }),
				getMailTemplateSql({ projectId: null, type: 'newUserInvited' }),
			),
		],
		sentMails: [
			{
				subject: 'You have been invited to blog',
			},
		],
		return: {
			data: {
				invite: {
					ok: true,
					errors: [],
					result: {
						person: {
							id: personId,
							identity: {
								id: identityId,
							},
						},
					},
				},
			},
		},
		expectedAuthLog: {
			type: 'person_invite',
			response: { ok: true, result: null },
			targetPersonId: personId,
			personInput: email,
			eventData: {
				projectSlug,
				isNew: true,
				unmanaged: false,
				memberships: [
					{
						role: 'editor',
						variables: [{ name: 'language', values: [languageId] }],
					},
				],
			},
		},
	})
})

test('invite a new person with password reset', async () => {
	const languageId = testUuid(555)
	const email = 'john@doe.com'
	const identityId = testUuid(1)
	const personId = testUuid(2)
	const passwordTokenId = testUuid(3)
	const membershipId = testUuid(4)
	const variableId = testUuid(5)
	const projectId = testUuid(6)
	const projectSlug = 'blog'

	await executeTenantTest({
		query: inviteMutation({
			email,
			projectSlug,
			memberships: [
				{
					role: 'editor',
					variables: [{ name: 'language', values: [languageId] }],
				},
			],
			method: 'RESET_PASSWORD',
		}),
		executes: [
			getProjectBySlugSql({
				projectSlug,
				response: { id: projectId, name: projectSlug, slug: projectSlug, config: {} },
			}),
			...sqlTransaction(
				getPersonByEmailSql({ email, response: null }),
				createIdentitySql({ roles: ['person'], identityId }),
				createPersonSql({ identityId, personId, email }),
				createPersonTokenSql({
					personId,
					tokenHash: '9692e67b8378a6f6753f97782d458aa757e947eab2fbdf6b5c187b74561eb78f',
					resetId: passwordTokenId,
					type: 'password_reset',
				}),
				createMembershipSql({ membershipId, projectId, identityId, role: 'editor' }),
				patchVariablesSql({
					id: variableId,
					membershipId,
					values: [languageId],
					variableName: 'language',
				}),
				getMailTemplateSql({ projectId, type: 'newUserInvited' }),
				getMailTemplateSql({ projectId: null, type: 'newUserInvited' }),
			),
		],
		sentMails: [
			{
				subject: 'You have been invited to blog',
			},
		],
		return: {
			data: {
				invite: {
					ok: true,
					errors: [],
					result: {
						person: {
							id: personId,
							identity: {
								id: identityId,
							},
						},
					},
				},
			},
		},
		expectedAuthLog: {
			type: 'person_invite',
			response: { ok: true, result: null },
			targetPersonId: personId,
			personInput: email,
			eventData: {
				projectSlug,
				isNew: true,
				unmanaged: false,
				memberships: [
					{
						role: 'editor',
						variables: [{ name: 'language', values: [languageId] }],
					},
				],
			},
		},
	})
})
