import { executeTenantTest } from '../../../src/testTenant.js'
import { SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { requestEmailVerificationMutation } from './gql/emailVerification.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { getNextMailAttemptSql } from './sql/getNextMailAttemptSql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { getMailTemplateSql } from './sql/getMailTemplateSql.js'

const anyString = (val: unknown) => typeof val === 'string'
const isDate = (val: unknown) => val instanceof Date

// Anti-enumeration: an unknown address still reports ok and does nothing
// observable — no mail, no auth-log entry — so the endpoint can't be used to
// probe which addresses are registered.
test('requestEmailVerification - unknown email reports ok without sending mail', async () => {
	const email = 'ghost@example.com'
	await executeTenantTest({
		query: requestEmailVerificationMutation({ email }),
		executes: [
			getPersonByEmailSql({ email, response: null }),
		],
		return: {
			data: {
				requestEmailVerification: {
					ok: true,
				},
			},
		},
		// No mail goes out, so no `email_verify_init` audit entry is recorded.
		sentMails: [],
	})
})

// A known, still-unverified address gets a verification mail and an
// `email_verify_init` audit entry. Rate-limiting runs before the token write.
test('requestEmailVerification - sends a verification mail for an unverified person', async () => {
	const email = 'jane@doe.com'
	const personId = testUuid(1)
	const identityId = testUuid(2)
	const projectId = testUuid(10)
	await executeTenantTest({
		query: requestEmailVerificationMutation({ email }),
		executes: [
			getPersonByEmailSql({ email, response: { personId, identityId, password: '123', roles: [], emailVerifiedAt: null } }),
			getNextMailAttemptSql({ email, initType: 'email_verify_init', completionType: 'email_verify_complete' }),
			{
				sql: SQL`INSERT INTO "tenant"."person_token" ("id", "token_hash", "person_id", "expires_at", "created_at", "used_at", "type", "meta")
				         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				parameters: [anyString, anyString, personId, isDate, isDate, null, 'email_verification', null],
				response: { rowCount: 1 },
			},
			getIdentityProjectsSql({ identityId, projectId }),
			getMailTemplateSql({ type: 'emailVerification', projectId }),
			getMailTemplateSql({ type: 'emailVerification', projectId: null }),
		],
		return: {
			data: {
				requestEmailVerification: {
					ok: true,
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'email_verify_init',
			personId,
			personInput: email,
			response: expect.objectContaining({ ok: true }),
		}),
		sentMails: [
			{
				subject: 'Verify your e-mail address',
			},
		],
	})
})
