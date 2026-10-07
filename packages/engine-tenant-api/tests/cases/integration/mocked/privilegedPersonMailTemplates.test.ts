import { describe, expect, test } from 'bun:test'
import { ExpectedQuery } from '@contember/database-tester'
import { authenticatedIdentityId, executeTenantTest, now } from '../../../src/testTenant.js'
import { SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { computeTokenHash } from '../../../../src/index.js'
import { createResetPasswordRequestMutation } from './gql/createResetPasswordRequest.js'
import { initSignInPasswordlessMutation } from './gql/passwordless.js'
import { confirmEmailChangeMutation, requestEmailVerificationMutation } from './gql/emailVerification.js'
import { changeMyProfileMutation } from './gql/changeMyProfile.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { getPersonByIdSql } from './sql/getPersonByIdSql.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { localAuthDisablingIdpsSql } from './sql/localAuthDisablingIdpsSql.js'
import { getNextMailAttemptSql } from './sql/getNextMailAttemptSql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { getMailTemplateSql } from './sql/getMailTemplateSql.js'
import { sqlTransaction } from './sql/sqlTransaction.js'

const anyString = (val: unknown) => typeof val === 'string'
const isDate = (val: unknown) => val instanceof Date

const personId = testUuid(1)
const identityId = testUuid(2)
const projectId = testUuid(10)
const projectSlug = 'foo'
const projectSubject = 'Project branded mail'

/**
 * How the mail template is chosen. A privileged person gets no project at all — so neither
 * the project lookup nor the project template lookup runs — while a regular person gets the
 * stored project template.
 */
const templateSelection = (args: {
	privileged: boolean
	type: string
	defaultSubject: string
	projectLookup?: ExpectedQuery
}): { projectLookup: ExpectedQuery[]; templateLookup: ExpectedQuery[]; subject: string } => {
	if (args.privileged) {
		return {
			projectLookup: [],
			templateLookup: [
				getMailTemplateSql({ type: args.type, projectId: null }),
				getMailTemplateSql({ type: args.type, projectId: null }),
			],
			subject: args.defaultSubject,
		}
	}
	return {
		projectLookup: [args.projectLookup ?? getIdentityProjectsSql({ identityId, projectId })],
		templateLookup: [getMailTemplateSql({ type: args.type, projectId, storedSubject: projectSubject })],
		subject: projectSubject,
	}
}

/** An anonymous caller may view every project, so the lookup is bound only by the target's memberships. */
const targetProjectsSql: ExpectedQuery = {
	sql: SQL`SELECT "project"."id", "project"."name", "project"."slug", "project"."config"
	         FROM "tenant"."project"
	         WHERE "project"."id" IN (SELECT "project_id" FROM "tenant"."project_membership" WHERE "identity_id" = ?)`,
	parameters: [identityId],
	response: { rows: [{ id: projectId, name: 'Foo', slug: projectSlug }] },
}

const createPersonTokenSql = (args: { type: string; meta?: (val: unknown) => boolean }): ExpectedQuery => ({
	sql: SQL`INSERT INTO "tenant"."person_token" ("id", "token_hash", "person_id", "expires_at", "created_at", "used_at", "type", "meta")
	         VALUES (?, ?, ?, now() + make_interval(secs => ?), ?, ?, ?, ?) RETURNING "expires_at"`,
	parameters: [anyString, anyString, personId, (val: unknown) => typeof val === 'number', isDate, null, args.type, args.meta ?? null],
	response: { rows: [{ expires_at: now }] },
})

const cases = [
	{ name: 'super_admin', roles: ['super_admin'], privileged: true },
	{ name: 'project_creator', roles: ['project_creator'], privileged: true },
	{ name: 'a regular person', roles: [], privileged: false },
]

describe.each(cases)('mail template for $name', ({ roles, privileged }) => {
	const expectedTemplate = privileged ? 'the global template' : 'the project template'

	test(`createResetPasswordRequest with mailProject uses ${expectedTemplate}`, async () => {
		const email = 'john@doe.com'
		const selection = templateSelection({ privileged, type: 'passwordReset', defaultSubject: 'Password reset' })
		await executeTenantTest({
			query: createResetPasswordRequestMutation({ email, mailProject: projectSlug }),
			executes: [
				getConfigSql(),
				getPersonByEmailSql({ email, response: { personId, identityId, password: '123', roles } }),
				localAuthDisablingIdpsSql({ personId }),
				getNextMailAttemptSql({ email, initType: 'password_reset_init', completionType: 'password_reset' }),
				createPersonTokenSql({ type: 'password_reset' }),
				...selection.projectLookup,
				...selection.templateLookup,
			],
			return: { data: { createResetPasswordRequest: { ok: true } } },
			expectedAuthLog: expect.objectContaining({ type: 'password_reset_init' }),
			sentMails: [{ subject: selection.subject }],
		})
	})

	test(`initSignInPasswordless with mailProject uses ${expectedTemplate}`, async () => {
		const email = 'john@doe.com'
		const config = getConfigSql({ passwordless_enabled: 'always' })
		const selection = templateSelection({
			privileged,
			type: 'passwordlessSignIn',
			defaultSubject: 'Sign in here',
			projectLookup: targetProjectsSql,
		})
		await executeTenantTest({
			query: initSignInPasswordlessMutation({ email, mailProject: projectSlug }),
			executes: [
				config,
				...sqlTransaction(
					config,
					getPersonByEmailSql({ email, response: { personId, identityId, password: '123', roles } }),
					localAuthDisablingIdpsSql({ personId }),
					getNextMailAttemptSql({ email, initType: 'passwordless_login_init', completionType: 'passwordless_login' }),
					createPersonTokenSql({ type: 'passwordless' }),
					...selection.projectLookup,
					...selection.templateLookup,
				),
			],
			return: { data: { initSignInPasswordless: { ok: true, error: null } } },
			expectedAuthLog: expect.objectContaining({ type: 'passwordless_login_init' }),
			sentMails: [{ subject: selection.subject }],
		})
	})

	test(`requestEmailVerification with mailProject uses ${expectedTemplate}`, async () => {
		const email = 'john@doe.com'
		const selection = templateSelection({ privileged, type: 'emailVerification', defaultSubject: 'Verify your e-mail address' })
		await executeTenantTest({
			query: requestEmailVerificationMutation({ email, mailProject: projectSlug }),
			executes: [
				getConfigSql(),
				getPersonByEmailSql({ email, response: { personId, identityId, password: '123', roles, emailVerifiedAt: null } }),
				getNextMailAttemptSql({ email, initType: 'email_verify_init', completionType: 'email_verify_complete' }),
				createPersonTokenSql({ type: 'email_verification', meta: val => typeof val === 'object' && val !== null }),
				...selection.projectLookup,
				...selection.templateLookup,
			],
			return: { data: { requestEmailVerification: { ok: true, error: null } } },
			expectedAuthLog: expect.objectContaining({ type: 'email_verify_init' }),
			sentMails: [{ subject: selection.subject }],
		})
	})

	test(`changeMyProfile e-mail change confirmation uses ${expectedTemplate}`, async () => {
		const newEmail = 'jane@doe.com'
		const selection = templateSelection({
			privileged,
			type: 'emailChangeVerify',
			defaultSubject: 'Confirm your new e-mail address',
			projectLookup: getIdentityProjectsSql({ identityId: authenticatedIdentityId, projectId }),
		})
		await executeTenantTest({
			query: changeMyProfileMutation({ email: newEmail }),
			identityRoles: roles,
			executes: [
				getPersonByIdentity({
					identityId: authenticatedIdentityId,
					response: { personId, email: 'john.doe@example.com', name: 'John Doe', roles, password: '123456' },
				}),
				getConfigSql({ require_email_change_verification: true }),
				getPersonByEmailSql({ email: newEmail, response: null }),
				getNextMailAttemptSql({ email: newEmail, initType: 'email_change_init', completionType: 'email_change_complete' }),
				...selection.projectLookup,
				...sqlTransaction(
					createPersonTokenSql({ type: 'email_change', meta: val => typeof val === 'object' && val !== null }),
					...selection.templateLookup,
				),
			],
			return: { data: { changeMyProfile: { ok: true, error: null } } },
			expectedAuthLog: expect.objectContaining({ type: 'email_change_init' }),
			sentMails: [{ subject: selection.subject }],
		})
	})

	test(`confirmEmailChange notification uses ${expectedTemplate}`, async () => {
		const token = 'email-change-token'
		const tokenId = testUuid(3)
		const newEmail = 'jane@doe.com'
		const selection = templateSelection({ privileged, type: 'emailChangeNotify', defaultSubject: 'Your e-mail address was changed' })
		await executeTenantTest({
			query: confirmEmailChangeMutation({ token }),
			executes: [
				{
					sql: SQL`SELECT *, "expires_at" <= now() as "is_expired" FROM "tenant"."person_token" WHERE "token_hash" = ? AND "type" = ?`,
					parameters: [anyString, 'email_change'],
					response: {
						rows: [{
							id: tokenId,
							token_hash: computeTokenHash(token),
							person_id: personId,
							created_at: now,
							expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000),
							is_expired: false,
							used_at: null,
							otp_hash: null,
							otp_attempts: 0,
							meta: { email: newEmail },
						}],
					},
				},
				getPersonByIdSql({ personId, response: { personId, identityId, password: '123', roles, email: 'john.doe@example.com' } }),
				getPersonByEmailSql({ email: newEmail, response: null }),
				...sqlTransaction(
					{
						sql: SQL`UPDATE "tenant"."person_token" SET "used_at" = ? WHERE "id" = ? AND "used_at" IS NULL`,
						parameters: [isDate, tokenId],
						response: { rowCount: 1 },
					},
					{
						sql: SQL`UPDATE "tenant"."person" SET "email_verified_at" = ?, "email" = ? WHERE "id" = ?`,
						parameters: [isDate, newEmail, personId],
						response: { rowCount: 1 },
					},
					{
						sql: SQL`UPDATE "tenant"."api_key" SET "disabled_at" = ? WHERE "identity_id" = ?`,
						parameters: [isDate, identityId],
						response: { rowCount: 1 },
					},
				),
				...selection.projectLookup,
				...selection.templateLookup,
			],
			return: { data: { confirmEmailChange: { ok: true, error: null } } },
			expectedAuthLog: expect.objectContaining({ type: 'email_change_complete' }),
			sentMails: [{ subject: selection.subject }],
		})
	})
})
