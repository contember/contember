import { expect, test } from 'bun:test'
import { createTester, executeGraphql, loginToken, rand } from '../../src/tester.js'
import { emptySchema } from '@contember/schema-utils'

const disableMutation = `mutation($id: String!) {
	disablePerson(personId: $id) { ok error { code } }
}`

const enableMutation = `mutation($id: String!) {
	enablePerson(personId: $id) { ok error { code } }
}`

const signInMutation = `mutation($email: String!, $password: String!) {
	signIn(email: $email, password: $password) { ok error { code } }
}`

/**
 * Looked up as the admin rather than through `me`, on purpose. Authenticating as the person schedules a background
 * write to their `api_key` row (`ApiKeyManager.verifyAndProlong` fires it from `setImmediate` and does not await
 * it), and `disablePerson` updates that very row inside a repeatable-read transaction. The two race, and the
 * mutation is the one that loses — it aborts with `could not serialize access due to concurrent update`, which the
 * caller sees as `Internal server error` and this test used to see as a bare `null`. The root token has no
 * `api_key` row, so asking as the admin leaves the person's row alone.
 */
const personsQuery = `query($email: String!) {
	persons(filter: { email: $email }) { id disabledAt }
}`

const findPerson = async (email: string): Promise<{ id: string; disabledAt: string | null }> => {
	const resp = await executeGraphql('/tenant', personsQuery, { variables: { email } })
	const persons = resp.body.data.persons
	expect(persons).toHaveLength(1)
	return persons[0]
}

test('disablePerson blocks future signIn with PERSON_DISABLED', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)

	// initial signIn works
	await tester.tenant.signIn(email, password)
	const personId = (await findPerson(email)).id

	const disableResp = await executeGraphql('/tenant', disableMutation, { variables: { id: personId } })
	expect(disableResp.body.data.disablePerson).toEqual({ ok: true, error: null })

	const retry = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password },
	})
	expect(retry.body.data.signIn.ok).toBe(false)
	expect(retry.body.data.signIn.error.code).toBe('PERSON_DISABLED')

	const second = await executeGraphql('/tenant', disableMutation, { variables: { id: personId } })
	expect(second.body.data.disablePerson.ok).toBe(false)
	expect(second.body.data.disablePerson.error.code).toBe('PERSON_ALREADY_DISABLED')
})

test('enablePerson restores signIn and reports the disabled state', async () => {
	const tester = await createTester(emptySchema)
	const email = `jane-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)

	await tester.tenant.signIn(email, password)
	const person = await findPerson(email)
	const personId = person.id
	expect(person.disabledAt).toBe(null)

	// Asserted rather than fired and forgotten: a silent failure here surfaces one step later as
	// enablePerson reporting PERSON_ALREADY_ENABLED, which blames the wrong mutation.
	const disableResp = await executeGraphql('/tenant', disableMutation, { variables: { id: personId } })
	expect(disableResp.body.data.disablePerson).toEqual({ ok: true, error: null })

	const enableResp = await executeGraphql('/tenant', enableMutation, { variables: { id: personId } })
	expect(enableResp.body.data.enablePerson).toEqual({ ok: true, error: null })

	const retry = await executeGraphql('/tenant', signInMutation, {
		authorizationToken: loginToken,
		variables: { email, password },
	})
	expect(retry.body.data.signIn.ok).toBe(true)

	const second = await executeGraphql('/tenant', enableMutation, { variables: { id: personId } })
	expect(second.body.data.enablePerson.ok).toBe(false)
	expect(second.body.data.enablePerson.error.code).toBe('PERSON_ALREADY_ENABLED')
})

test('enablePerson returns PERSON_NOT_FOUND for unknown id', async () => {
	const tester = await createTester(emptySchema)
	void tester
	const resp = await executeGraphql('/tenant', enableMutation, {
		variables: { id: '00000000-0000-0000-0000-000000000000' },
	})
	expect(resp.body.data.enablePerson.ok).toBe(false)
	expect(resp.body.data.enablePerson.error.code).toBe('PERSON_NOT_FOUND')
})

test('disablePerson returns PERSON_NOT_FOUND for unknown id', async () => {
	const tester = await createTester(emptySchema)
	void tester
	const resp = await executeGraphql('/tenant', disableMutation, {
		variables: { id: '00000000-0000-0000-0000-000000000000' },
	})
	expect(resp.body.data.disablePerson.ok).toBe(false)
	expect(resp.body.data.disablePerson.error.code).toBe('PERSON_NOT_FOUND')
})
