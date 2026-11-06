import { expect, test } from 'bun:test'
import { ExpectedQuery } from '@contember/database-tester'
import { executeTenantTest } from '../../../src/testTenant.js'
import { testUuid } from '../../../src/testUuid.js'
import { signInMutation } from './gql/signIn.js'
import { getConfigSql } from './sql/getConfigSql.js'
import { getNextLoginAttemptSql } from './sql/getNextLoginAttemptSql.js'
import { getPersonByEmailSql } from './sql/getPersonByEmailSql.js'
import { localAuthDisablingIdpsSql } from './sql/localAuthDisablingIdpsSql.js'

const email = 'john@doe.com'
const personId = testUuid(7)
const identityId = testUuid(2)

/** Every refusal must spend one password comparison, so its timing matches a wrong password. */
const expectOnePasswordComparison = async (executes: ExpectedQuery[], code: string) => {
	const compared: string[] = []
	await executeTenantTest({
		query: signInMutation({ email, password: 'guess' }),
		providers: {
			bcryptCompare: (data: string, hash: string) => {
				compared.push(data)
				return Promise.resolve('BCRYPTED-' + data === hash)
			},
		},
		executes: [getConfigSql(), ...executes],
		return: { data: { signIn: { ok: false, errors: [{ code }], result: null } } },
		expectedAuthLog: expect.objectContaining({ type: 'login' }),
	})
	expect(compared).toEqual(['guess'])
}

test('an unknown e-mail spends a password comparison', async () => {
	await expectOnePasswordComparison([
		getPersonByEmailSql({ email, response: null }),
		getNextLoginAttemptSql({ normalizedEmail: email }),
	], 'UNKNOWN_EMAIL')
})

test('a disabled person spends a password comparison', async () => {
	await expectOnePasswordComparison([
		getPersonByEmailSql({ email, response: { personId, identityId, password: 'secret', roles: [], disabledAt: new Date() } }),
		getNextLoginAttemptSql({ personId }),
		localAuthDisablingIdpsSql({ personId }),
	], 'PERSON_DISABLED')
})

test('a person bound to an identity provider spends a password comparison', async () => {
	await expectOnePasswordComparison([
		getPersonByEmailSql({ email, response: { personId, identityId, password: 'secret', roles: [] } }),
		getNextLoginAttemptSql({ personId }),
		localAuthDisablingIdpsSql({ personId, slugs: ['corporate'] }),
	], 'IDP_REQUIRED')
})

test('a wrong password spends one password comparison', async () => {
	await expectOnePasswordComparison([
		getPersonByEmailSql({ email, response: { personId, identityId, password: 'secret', roles: [] } }),
		getNextLoginAttemptSql({ personId }),
		localAuthDisablingIdpsSql({ personId }),
	], 'INVALID_PASSWORD')
})
