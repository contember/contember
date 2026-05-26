import { executeTenantTest, now } from '../../../src/testTenant.js'
import { SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { selectMembershipsSql } from './sql/selectMembershipsSql.js'
import { signInMutation } from './gql/signIn.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { SignInErrorCode } from '../../../../src/schema/index.js'
import { expect, test } from 'bun:test'
import { OtpAuthenticator } from '../../../../src/index.js'
import { Buffer } from 'buffer'
import { createSessionKeySql } from './sql/createSessionKeySql.js'
import { getIdentityProjectsSql } from './sql/getIdentityProjectsSql.js'
import { getNextLoginAttemptSql } from './sql/getNextLoginAttemptSql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { consumeBackupCodeSql, countUnusedBackupCodesSql } from './sql/consumeBackupCodeSql.js'
import { claimEmailOtpAttemptSql, consumeEmailOtpTokenSql, EMAIL_OTP_CODE, getLatestEmailOtpTokenSql, sendEmailOtpSql } from './sql/emailOtpSql.js'
import { getMailTemplateSql } from './sql/getMailTemplateSql.js'
import { getAuthPoliciesSql } from './sql/authPolicySql.js'
import { getIdentityByIdSql } from './sql/getIdentityByIdSql.js'

test('signs in', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		query: signInMutation({ email, password }, { withData: true }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
			getAuthPoliciesSql(),
			getConfigSql(),
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId: apiKeyId, identityId: identityId }),
			getIdentityProjectsSql({ identityId: identityId, projectId: projectId }),
			selectMembershipsSql({
				identityId: identityId,
				projectId,
				membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }],
			}),
		],
		return: {
			data: {
				signIn: {
					ok: true,
					errors: [],
					result: {
						person: {
							id: personId,
							identity: {
								projects: [
									{
										project: {
											slug: 'foo',
										},
										memberships: [
											{
												role: 'editor',
											},
										],
									},
								],
							},
						},
						token: '0000000000000000000000000000000000000000',
					},
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({
				ok: true,
			}),
		},
	})
})

test('signs in - normalize email', async () => {
	const email = 'John@doe.com '
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		query: signInMutation({ email, password }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: null }),
			getPersonByEmailSql({ email: 'john@doe.com', response: { personId, identityId, password, roles: [] } }),
			getAuthPoliciesSql(),
			getConfigSql(),
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId: apiKeyId, identityId: identityId }),
			getIdentityProjectsSql({ identityId: identityId, projectId: projectId }),
			selectMembershipsSql({
				identityId: identityId,
				projectId,
				membershipsResponse: [{ role: 'editor', variables: [{ name: 'locale', values: ['cs'] }] }],
			}),
		],
		return: {
			data: {
				signIn: {
					ok: true,
					errors: [],
					result: {
						token: '0000000000000000000000000000000000000000',
					},
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({
				ok: true,
			}),
		},
	})
})

test('sign in - invalid password', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	await executeTenantTest({
		query: signInMutation({ email, password: 'abcd' }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [] } }),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: 'INVALID_PASSWORD' }],
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({
				ok: false,
			}),
		},
	})
})

test('sign in - email not verified', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	await executeTenantTest({
		query: signInMutation({ email, password }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({
				email,
				response: { personId, identityId, password, roles: [], emailVerificationRequired: true, emailVerifiedAt: null },
			}),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: 'EMAIL_NOT_VERIFIED' }],
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({
				ok: false,
			}),
		},
	})
})

test('sign in - email verification required but already verified', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const projectId = testUuid(10)
	const apiKeyId = testUuid(1)
	await executeTenantTest({
		query: signInMutation({ email, password }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({
				email,
				response: { personId, identityId, password, roles: [], emailVerificationRequired: true, emailVerifiedAt: now },
			}),
			getConfigSql(),
			createSessionKeySql({ apiKeyId, identityId }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: {
				signIn: {
					ok: true,
					errors: [],
					result: {
						token: '0000000000000000000000000000000000000000',
					},
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({
				ok: true,
			}),
		},
	})
})

test('otp token not provided', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	await executeTenantTest({
		query: signInMutation({ email, password }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({
				email,
				response: {
					personId,
					identityId,
					password,
					roles: [],
					otpUri: 'otpauth://totp/contember:john?secret=ABCDEFG&period=30&digits=6&algorithm=SHA1&issuer=contember',
				},
			}),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: 'OTP_REQUIRED' }],
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({
				ok: false,
			}),
		},
	})
})

test('sign in - invalid otp token', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)

	const otpAuth = new OtpAuthenticator({
		now: () => now,
		randomBytes: () => Promise.resolve(Buffer.alloc(20)),
	})
	const otp = await otpAuth.create('john', 'contember')

	await executeTenantTest({
		query: signInMutation({ email, password, otpToken: '123456' }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [], otpUri: otp.uri } }),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: 'INVALID_OTP_TOKEN' }],
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({
				ok: false,
			}),
		},
	})
})

test('sign in - valid otp token', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const otpAuth = new OtpAuthenticator({
		now: () => now,
		randomBytes: () => Promise.resolve(Buffer.alloc(20)),
	})
	const otp = await otpAuth.create('john', 'contember')
	const apiKeyId = testUuid(1)
	const projectId = testUuid(10)
	await executeTenantTest({
		query: signInMutation({ email, password, otpToken: otpAuth.generate(otp) }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [], otpUri: otp.uri } }),
			getConfigSql(),
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: [],
			}),
		],
		return: {
			data: {
				signIn: {
					ok: true,
					errors: [],
					result: {
						token: '0000000000000000000000000000000000000000',
					},
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({
				ok: true,
			}),
		},
	})
})

// Normalized 'abcdefghij' (formatted 'abcde-fghij'), hashed with sha256.
const BACKUP_CODE = 'abcde-fghij'
const BACKUP_CODE_HASH = '72399361da6a7754fec986dca5b7cbaf1c810a28ded4abaf56b2106d06cb78b0'

test('sign in - valid backup code (when OTP is required)', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const otpAuth = new OtpAuthenticator({
		now: () => now,
		randomBytes: () => Promise.resolve(Buffer.alloc(20)),
	})
	const otp = await otpAuth.create('john', 'contember')
	const apiKeyId = testUuid(1)
	const projectId = testUuid(10)
	await executeTenantTest({
		query: signInMutation({ email, password, backupCode: BACKUP_CODE }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [], otpUri: otp.uri } }),
			consumeBackupCodeSql({ personId, codeHash: BACKUP_CODE_HASH, consumed: true }),
			countUnusedBackupCodesSql({ personId, count: 4 }),
			getConfigSql(),
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({
				identityId,
				projectId,
				membershipsResponse: [],
			}),
		],
		return: {
			data: {
				signIn: {
					ok: true,
					errors: [],
					result: {
						token: '0000000000000000000000000000000000000000',
					},
				},
			},
		},
		expectedAuthLog: [
			{
				type: 'login',
				response: expect.objectContaining({
					ok: true,
				}),
			},
			expect.objectContaining({
				type: 'backup_code_used',
				response: expect.objectContaining({
					ok: true,
				}),
			}),
		],
	})
})

test('sign in - email OTP enabled, no code provided: dispatches a code and returns OTP_REQUIRED', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	await executeTenantTest({
		query: signInMutation({ email, password }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [], emailOtpEnabled: true } }),
			// signIn lazily re-fetches the config to resolve the email-OTP send rate limit.
			getConfigSql(),
			...sendEmailOtpSql({ personId, rateLimitEventId: testUuid(1), tokenId: testUuid(2) }),
			getMailTemplateSql({ type: 'emailOtp', projectId: null }),
			getMailTemplateSql({ type: 'emailOtp', projectId: null }),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: 'OTP_REQUIRED' }],
					result: null,
				},
			},
		},
		sentMails: [{ subject: 'Your verification code' }],
		expectedAuthLog: [
			{
				type: 'login',
				response: expect.objectContaining({ ok: false }),
			},
			expect.objectContaining({
				type: 'email_otp_sent',
				response: expect.objectContaining({ ok: false }),
			}),
		],
	})
})

test('sign in - email OTP enabled, valid code: signs in', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const tokenId = testUuid(50)
	const apiKeyId = testUuid(1)
	const projectId = testUuid(10)
	await executeTenantTest({
		query: signInMutation({ email, password, otpToken: EMAIL_OTP_CODE }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [], emailOtpEnabled: true } }),
			getLatestEmailOtpTokenSql({ personId, tokenId }),
			claimEmailOtpAttemptSql({ tokenId }),
			consumeEmailOtpTokenSql({ tokenId }),
			getConfigSql(),
			getIdentityByIdSql({ identityId }),
			getAuthPoliciesSql(),
			createSessionKeySql({ apiKeyId, identityId }),
			getIdentityProjectsSql({ identityId, projectId }),
			selectMembershipsSql({ identityId, projectId, membershipsResponse: [] }),
		],
		return: {
			data: {
				signIn: {
					ok: true,
					errors: [],
					result: {
						token: '0000000000000000000000000000000000000000',
					},
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: true }),
		},
	})
})

test('sign in - email OTP enabled, invalid code: INVALID_OTP_TOKEN', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const tokenId = testUuid(50)
	await executeTenantTest({
		query: signInMutation({ email, password, otpToken: '111111' }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [], emailOtpEnabled: true } }),
			getLatestEmailOtpTokenSql({ personId, tokenId }),
			claimEmailOtpAttemptSql({ tokenId }),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: 'INVALID_OTP_TOKEN' }],
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({ ok: false }),
		},
	})
})

test('sign in - already-used backup code is rejected', async () => {
	const email = 'john@doe.com'
	const password = '123'
	const identityId = testUuid(2)
	const personId = testUuid(7)
	const otpAuth = new OtpAuthenticator({
		now: () => now,
		randomBytes: () => Promise.resolve(Buffer.alloc(20)),
	})
	const otp = await otpAuth.create('john', 'contember')
	await executeTenantTest({
		query: signInMutation({ email, password, backupCode: BACKUP_CODE }),
		executes: [
			getConfigSql(),
			getNextLoginAttemptSql(email),
			getPersonByEmailSql({ email, response: { personId, identityId, password, roles: [], otpUri: otp.uri } }),
			consumeBackupCodeSql({ personId, codeHash: BACKUP_CODE_HASH, consumed: false }),
		],
		return: {
			data: {
				signIn: {
					ok: false,
					errors: [{ code: 'INVALID_OTP_TOKEN' }],
					result: null,
				},
			},
		},
		expectedAuthLog: {
			type: 'login',
			response: expect.objectContaining({
				ok: false,
			}),
		},
	})
})
