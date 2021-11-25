import { testUuid } from '../../../src/testUuid'
import { authenticatedApiKeyId, executeTenantTest } from '../../../src/testTenant'
import { inviteMutation } from './gql/invite'
import { SQL } from '../../../src/tags'
import { patchVariablesSql } from './sql/patchVariablesSql'
import { getProjectBySlugSql } from './sql/getProjectBySlugSql'
import { sqlTransaction } from './sql/sqlTransaction'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql'
import { createIdentitySql } from './sql/createIdentitySql'
import { createMembershipSql } from './sql/createMembershipSql'
import { createPersonSql } from './sql/createPersonSql'
import { disableOneOffKeySql } from './sql/disableOneOffKeySql'
import { test } from 'uvu'

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
				{
					sql: `select "id", "subject", "content", "use_layout" as "uselayout"
							from "tenant"."mail_template"
							where "project_id" = ? and "mail_type" = ? and "variant" = ?`,
					parameters: [projectId, 'newUserInvited', ''],
					response: {
						rows: [],
					},
				},
				{
					sql: `select "id", "subject", "content", "use_layout" as "uselayout"
							from "tenant"."mail_template"
							where "project_id" is null and "mail_type" = ? and "variant" = ?`,
					parameters: ['newUserInvited', ''],
					response: {
						rows: [],
					},
				},
			),
			disableOneOffKeySql({ id: authenticatedApiKeyId }),
			{
				sql: SQL`SELECT "project"."id",
						         "project"."name",
						         "project"."slug",
						         "project"."config"
					         FROM "tenant"."project"
						              INNER JOIN "tenant"."project_member" AS "project_member" ON "project_member"."project_id" = "project"."id"
					         WHERE "project_member"."identity_id" = ?`,
				parameters: [identityId],
				response: { rows: [{ id: membershipId, name: 'foo', slug: 'foo' }] },
			},
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
	})
})

test.run()
