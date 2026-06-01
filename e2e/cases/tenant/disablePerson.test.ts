import { expect, test } from 'bun:test'
import { createTester, executeGraphql, loginToken, rand } from '../../src/tester.js'
import { emptySchema } from '@contember/schema-utils'

const disableMutation = `mutation($id: String!) {
	disablePerson(personId: $id) { ok error { code } }
}`

const signInMutation = `mutation($email: String!, $password: String!) {
	signIn(email: $email, password: $password) { ok error { code } }
}`

test('disablePerson blocks future signIn with PERSON_DISABLED', async () => {
	const tester = await createTester(emptySchema)
	const email = `john-${rand()}@doe.com`
	const password = 'HWGA51KKpJ4lSW'
	await tester.tenant.signUp(email, password)

	// initial signIn works
	const token = await tester.tenant.signIn(email, password)
	const personResp = await executeGraphql('/tenant', `query { me { person { id } } }`, { authorizationToken: token })
	const personId: string = personResp.body.data.me.person.id

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

test('disablePerson returns PERSON_NOT_FOUND for unknown id', async () => {
	const tester = await createTester(emptySchema)
	void tester
	const resp = await executeGraphql('/tenant', disableMutation, {
		variables: { id: '00000000-0000-0000-0000-000000000000' },
	})
	expect(resp.body.data.disablePerson.ok).toBe(false)
	expect(resp.body.data.disablePerson.error.code).toBe('PERSON_NOT_FOUND')
})
