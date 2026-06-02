import { authenticatedIdentityId, executeTenantTest } from "../../../src/testTenant.js"
import { testUuid } from "../../../src/testUuid.js"
import { getPersonByIdentity } from "./sql/getPersonByIdentity.js"
import { getAllProjectRolesByIdentitySql, getAuthPoliciesSql } from "./sql/authPolicySql.js"
import { expect, test } from 'bun:test'
import { GQL } from "../../../src/tags.js"

const disableOtpMutation = () => ({
	query: GQL`mutation { disableOtp { ok error { code } } }`,
	variables: {},
})

test('disableOtp is blocked when MFA is required and TOTP is the only factor', async () => {
	const personId = testUuid(1)
	const otpUri = 'otpauth://totp/contember:john?secret=ABCDEFG&period=30&digits=6&algorithm=SHA1&issuer=contember'
	await executeTenantTest({
		query: disableOtpMutation(),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, password: '123', roles: ['editor'], email: 'john@doe.com', otpUri },
			}),
			getAuthPoliciesSql([{ id: testUuid(900), scope: 'global', roles: ['editor'], mfaRequired: true }]),
			getAllProjectRolesByIdentitySql({ identityId: authenticatedIdentityId }),
		],
		return: (response: any) => {
			expect(response.data.disableOtp.ok).toBe(false)
			expect(response.data.disableOtp.error.code).toBe('MFA_REQUIRED')
		},
	})
})

test('disableOtp succeeds with no policy (zero-policy behavior unchanged)', async () => {
	const personId = testUuid(1)
	const otpUri = 'otpauth://totp/contember:john?secret=ABCDEFG&period=30&digits=6&algorithm=SHA1&issuer=contember'
	await executeTenantTest({
		query: disableOtpMutation(),
		executes: [
			getPersonByIdentity({
				identityId: authenticatedIdentityId,
				response: { personId, password: '123', roles: ['editor'], email: 'john@doe.com', otpUri },
			}),
			getAuthPoliciesSql([]),
			{
				sql: `update "tenant"."person_mfa"
					set "totp_secret" = ?, "totp_secret_version" = ?, "totp_activated_at" = ?, "totp_pending_secret" = ?, "totp_pending_version" = ?, "totp_pending_created_at" = ?
					where "person_id" = ?`,
				parameters: [null, null, null, null, null, null, personId],
				response: { rowCount: 1 },
			},
			{
				sql: `delete from "tenant"."person_backup_code" where "person_id" = ?`,
				parameters: [personId],
				response: { rowCount: 0 },
			},
		],
		return: (response: any) => {
			expect(response.data.disableOtp.ok).toBe(true)
		},
		expectedAuthLog: expect.objectContaining({ type: '2fa_disable' }),
	})
})
