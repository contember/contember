import { authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant.js'
import { SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { changeMyProfileMutation } from './gql/changeMyProfile.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { getMailTemplateSql } from './sql/getMailTemplateSql.js'

const anyString = (val: unknown) => typeof val === 'string'
const isDate = (val: unknown) => val instanceof Date

// A12: with verification enabled, changeMyProfile does NOT swap the email; it
// creates an email_change token and mails a confirmation link to the new address.
test('changeMyProfile - email change is deferred when verification is required', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const projectId = testUuid(10)
	const newEmail = 'jane@doe.com'
	await executeTenantTest({
		query: changeMyProfileMutation({ email: newEmail }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			getConfigSql({ signup_require_email_verification: true }),
			getPersonByEmailSql({ email: newEmail, response: null }),
			{
				sql: SQL`INSERT INTO "tenant"."person_token" ("id", "token_hash", "person_id", "expires_at", "created_at", "used_at", "type", "meta")
				         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				parameters: [
					anyString,
					anyString,
					personId,
					isDate,
					isDate,
					null,
					'email_change',
					(val: any) => !!val && val.email === newEmail,
				],
				response: { rowCount: 1 },
			},
			getIdentityProjectsSql({ identityId, projectId }),
			getMailTemplateSql({ type: 'emailChangeVerify', projectId }),
			getMailTemplateSql({ type: 'emailChangeVerify', projectId: null }),
		],
		return: {
			data: {
				changeMyProfile: {
					ok: true,
					error: null,
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'email_change_init',
			personId,
			response: expect.objectContaining({ ok: true }),
		}),
		sentMails: [
			{
				subject: 'Confirm your new e-mail address',
			},
		],
	})
})
