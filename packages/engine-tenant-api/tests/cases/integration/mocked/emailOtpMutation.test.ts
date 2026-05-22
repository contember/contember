import { authenticatedIdentityId, executeTenantTest, now } from '../../../src/testTenant'
import { testUuid } from '../../../src/testUuid'
import { getPersonByIdentity } from './sql/getPersonByIdentity'
import { generateBackupCodesSql } from './sql/generateBackupCodesSql'
import { confirmEmailOtpMutation, initEmailOtpMutation } from './gql/emailOtp'
import { claimEmailOtpAttemptSql, consumeEmailOtpTokenSql, EMAIL_OTP_CODE, getLatestEmailOtpTokenSql, sendEmailOtpSql } from './sql/emailOtpSql'
import { setEmailOtpEnabledSql } from './sql/setEmailOtpEnabledSql'
import { getConfigSql } from './sql/getConfigSql'
import { expect, test } from 'bun:test'

test('initEmailOtp sends a code', async () => {
	const personId = testUuid(1)
	await executeTenantTest({
		query: initEmailOtpMutation(),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, password: '123', roles: [], email: 'john@doe.com' },
			}),
			getConfigSql(),
			...sendEmailOtpSql({ personId, rateLimitEventId: testUuid(1), tokenId: testUuid(2) }),
			{
				sql:
					`select "mail_template"."id", "subject", "content", "use_layout" as "useLayout", "reply_to" as "replyTo", "project_id" as "projectId", "mail_type" as "type", "variant" FROM "tenant"."mail_template" WHERE "project_id" IS NULL AND "mail_type" = ? AND "variant" = ?`,
				parameters: ['emailOtp', ''],
				response: { rows: [] },
			},
			{
				sql:
					`select "mail_template"."id", "subject", "content", "use_layout" as "useLayout", "reply_to" as "replyTo", "project_id" as "projectId", "mail_type" as "type", "variant" FROM "tenant"."mail_template" WHERE "project_id" IS NULL AND "mail_type" = ? AND "variant" = ?`,
				parameters: ['emailOtp', ''],
				response: { rows: [] },
			},
		],
		return: {
			data: {
				initEmailOtp: { ok: true, error: null },
			},
		},
		sentMails: [{ subject: 'Your verification code' }],
	})
})

test('confirmEmailOtp enables email OTP and returns backup codes', async () => {
	const personId = testUuid(1)
	const tokenId = testUuid(50)
	await executeTenantTest({
		query: confirmEmailOtpMutation({ token: EMAIL_OTP_CODE }),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, password: '123', roles: [], email: 'john@doe.com' },
			}),
			getLatestEmailOtpTokenSql({ personId, tokenId }),
			claimEmailOtpAttemptSql({ tokenId }),
			consumeEmailOtpTokenSql({ tokenId }),
			setEmailOtpEnabledSql({ personId, enabled: true }),
			...generateBackupCodesSql({ personId, firstUuidIndex: 1 }),
		],
		return: {
			data: {
				confirmEmailOtp: {
					ok: true,
					error: null,
					result: {
						backupCodes: [
							'aaaaa-aaaaa',
							'aaaaa-aaaaa',
							'aaaaa-aaaaa',
							'aaaaa-aaaaa',
							'aaaaa-aaaaa',
							'aaaaa-aaaaa',
							'aaaaa-aaaaa',
							'aaaaa-aaaaa',
							'aaaaa-aaaaa',
							'aaaaa-aaaaa',
						],
					},
				},
			},
		},
		expectedAuthLog: [
			expect.objectContaining({ type: '2fa_enable', response: expect.objectContaining({ ok: true }) }),
			expect.objectContaining({ type: 'backup_code_generated', response: expect.objectContaining({ ok: true }) }),
		],
	})
})

test('confirmEmailOtp rejects an invalid code', async () => {
	const personId = testUuid(1)
	const tokenId = testUuid(50)
	await executeTenantTest({
		query: confirmEmailOtpMutation({ token: '111111' }),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, password: '123', roles: [], email: 'john@doe.com' },
			}),
			getLatestEmailOtpTokenSql({ personId, tokenId }),
			claimEmailOtpAttemptSql({ tokenId }),
		],
		return: {
			data: {
				confirmEmailOtp: {
					ok: false,
					error: { code: 'INVALID_OTP_TOKEN' },
					result: null,
				},
			},
		},
	})
})
