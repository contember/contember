import { expect, test } from 'bun:test'
import { authenticatedIdentityId, executeTenantTest } from '../../../src/testTenant.js'
import { GQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { getAuthPoliciesSql } from './sql/authPolicySql.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getPersonByIdentity } from './sql/getPersonByIdentity.js'
import { reserveReauthenticationSql } from './sql/reserveReauthenticationSql.js'

const personId = testUuid(1)
const otpUri = 'otpauth://totp/contember:john?secret=ABCDEFG&period=30&digits=6&algorithm=SHA1&issuer=contember'
const reauthenticationOn = () => getConfigSql({ login_mfa_change_require_reauthentication: true })

const person = (overrides: { otpUri?: string; emailOtpEnabled?: boolean } = { otpUri }) =>
	getPersonByIdentity({
		identityId: authenticatedIdentityId,
		response: { personId, password: '123', roles: [], email: 'john@doe.com', ...overrides },
	})

const refused = (type: string) =>
	expect.objectContaining({
		type,
		response: expect.objectContaining({ ok: false }),
	})

test('disableOtp without re-authentication is refused when the option is on', async () => {
	await executeTenantTest({
		query: { query: GQL`mutation { disableOtp { ok error { code } } }`, variables: {} },
		executes: [person(), getAuthPoliciesSql([]), reauthenticationOn()],
		return: { data: { disableOtp: { ok: false, error: { code: 'REAUTHENTICATION_REQUIRED' } } } },
		expectedAuthLog: refused('2fa_disable'),
	})
})

test('disableOtp with the current password succeeds when the option is on', async () => {
	await executeTenantTest({
		query: { query: GQL`mutation { disableOtp(currentPassword: "123") { ok error { code } } }`, variables: {} },
		executes: [
			person(),
			getAuthPoliciesSql([]),
			reauthenticationOn(),
			...reserveReauthenticationSql({ personId }),
			{
				sql: `update "tenant"."person_mfa"
					set "totp_secret" = ?, "totp_secret_version" = ?, "totp_activated_at" = ?, "totp_pending_secret" = ?, "totp_pending_version" = ?, "totp_pending_created_at" = ?, "totp_last_counter" = ?
					where "person_id" = ?`,
				parameters: [null, null, null, null, null, null, null, personId],
				response: { rowCount: 1 },
			},
			{
				sql: `delete from "tenant"."person_backup_code" where "person_id" = ?`,
				parameters: [personId],
				response: { rowCount: 0 },
			},
		],
		return: { data: { disableOtp: { ok: true, error: null } } },
		expectedAuthLog: expect.objectContaining({ type: '2fa_disable', response: expect.objectContaining({ ok: true }) }),
	})
})

test('regenerateBackupCodes with a wrong password is refused when the option is on', async () => {
	await executeTenantTest({
		query: { query: GQL`mutation { regenerateBackupCodes(currentPassword: "wrong") { ok error { code } result { backupCodes } } }`, variables: {} },
		executes: [person(), reauthenticationOn(), ...reserveReauthenticationSql({ personId })],
		return: { data: { regenerateBackupCodes: { ok: false, error: { code: 'INVALID_PASSWORD' }, result: null } } },
		expectedAuthLog: refused('backup_code_regenerated'),
	})
})

test('disableEmailOtp without re-authentication is refused when the option is on', async () => {
	await executeTenantTest({
		query: { query: GQL`mutation { disableEmailOtp { ok error { code } } }`, variables: {} },
		executes: [person({ otpUri, emailOtpEnabled: true }), reauthenticationOn()],
		return: { data: { disableEmailOtp: { ok: false, error: { code: 'REAUTHENTICATION_REQUIRED' } } } },
		expectedAuthLog: refused('2fa_disable'),
	})
})

test('prepareOtp over an active TOTP without re-authentication is refused when the option is on', async () => {
	await executeTenantTest({
		query: { query: GQL`mutation { prepareOtp { ok error { code } result { otpUri } } }`, variables: {} },
		executes: [person(), reauthenticationOn()],
		return: { data: { prepareOtp: { ok: false, error: { code: 'REAUTHENTICATION_REQUIRED' }, result: null } } },
		expectedAuthLog: refused('2fa_enable'),
	})
})

test('disableOtp is refused after too many re-authentication attempts, even with the right password', async () => {
	await executeTenantTest({
		query: { query: GQL`mutation { disableOtp(currentPassword: "123") { ok error { code } } }`, variables: {} },
		executes: [person(), getAuthPoliciesSql([]), reauthenticationOn(), ...reserveReauthenticationSql({ personId, attempts: 6 })],
		return: { data: { disableOtp: { ok: false, error: { code: 'RATE_LIMIT_EXCEEDED' } } } },
		expectedAuthLog: refused('2fa_disable'),
	})
})
