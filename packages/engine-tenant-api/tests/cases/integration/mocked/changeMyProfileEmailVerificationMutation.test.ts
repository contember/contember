import { authenticatedIdentityId, executeTenantTest, now } from '../../../src/testTenant.js'
import { SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { expect, test } from 'bun:test'
import { changeMyProfileMutation } from './gql/changeMyProfile.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { getMailTemplateSql } from './sql/getMailTemplateSql.js'
import { getNextMailAttemptSql } from './sql/getNextMailAttemptSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'
import { updatePersonProfileNameSql } from './sql/updatePesonNameSql.js'

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
			getConfigSql({ require_email_change_verification: true }),
			getPersonByEmailSql({ email: newEmail, response: null }),
			getNextMailAttemptSql({ email: newEmail, initType: 'email_change_init', completionType: 'email_change_complete' }),
			getIdentityProjectsSql({ identityId, projectId }),
			...sqlTransaction(
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
				getMailTemplateSql({ type: 'emailChangeVerify', projectId }),
				getMailTemplateSql({ type: 'emailChangeVerify', projectId: null }),
			),
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

// A12b: even with the email-change flag OFF, an account that is itself subject to
// verification (email_verification_required, from signing up while signup
// verification was on) still defers the change through the token flow — signup
// verification implies change verification, so a verified address can't be swapped
// for an unproven one via the direct path.
test('changeMyProfile - email change is deferred for a verification-required account even without the change flag', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const projectId = testUuid(10)
	const newEmail = 'jane@doe.com'
	await executeTenantTest({
		query: changeMyProfileMutation({ email: newEmail }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: {
					personId,
					email: 'john.doe@example.com',
					name: 'John Doe',
					roles: [],
					password: '123456',
					// signup verification was on when this account was created
					emailVerificationRequired: true,
					emailVerifiedAt: now,
				},
			}),
			// require_email_change_verification stays at its default (false)
			getConfigSql(),
			getPersonByEmailSql({ email: newEmail, response: null }),
			getNextMailAttemptSql({ email: newEmail, initType: 'email_change_init', completionType: 'email_change_complete' }),
			getIdentityProjectsSql({ identityId, projectId }),
			...sqlTransaction(
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
				getMailTemplateSql({ type: 'emailChangeVerify', projectId }),
				getMailTemplateSql({ type: 'emailChangeVerify', projectId: null }),
			),
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

// B: the per-recipient backoff rejects the request before any write. No token
// is inserted and no mail is sent — the rate-limit check is the last query.
test('changeMyProfile - email change is rate-limited per recipient', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const newEmail = 'jane@doe.com'
	const future = new Date(now.getTime() + 60 * 1000)
	await executeTenantTest({
		query: changeMyProfileMutation({ email: newEmail }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			getConfigSql({ require_email_change_verification: true }),
			getPersonByEmailSql({ email: newEmail, response: null }),
			getNextMailAttemptSql({
				email: newEmail,
				initType: 'email_change_init',
				completionType: 'email_change_complete',
				response: { rows: [{ next_allowed_attempt: future }] },
			}),
		],
		return: {
			data: {
				changeMyProfile: {
					ok: false,
					error: { code: 'RATE_LIMIT_EXCEEDED' },
				},
			},
		},
		expectedAuthLog: expect.objectContaining({
			type: 'email_change_init',
			personId,
			personInput: newEmail,
			response: expect.objectContaining({ ok: false }),
		}),
		sentMails: [],
	})
})

// C: a simultaneous name change is applied INSIDE the same transaction as the
// token insert, proving the name change and the e-mail-change token are atomic
// (a rejected/failed e-mail change can never leave a half-applied name).
test('changeMyProfile - name change is applied atomically within the email-change transaction', async () => {
	const personId = testUuid(1)
	const identityId = authenticatedIdentityId
	const projectId = testUuid(10)
	const newEmail = 'jane@doe.com'
	const newName = 'Jane Doe'
	await executeTenantTest({
		query: changeMyProfileMutation({ email: newEmail, name: newName }),
		executes: [
			getPersonByIdentity({
				identityId,
				response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles: [], password: '123456' },
			}),
			getConfigSql({ require_email_change_verification: true }),
			getPersonByEmailSql({ email: newEmail, response: null }),
			getNextMailAttemptSql({ email: newEmail, initType: 'email_change_init', completionType: 'email_change_complete' }),
			getIdentityProjectsSql({ identityId, projectId }),
			...sqlTransaction(
				updatePersonProfileNameSql({ personId, name: newName }),
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
				getMailTemplateSql({ type: 'emailChangeVerify', projectId }),
				getMailTemplateSql({ type: 'emailChangeVerify', projectId: null }),
			),
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
