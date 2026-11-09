import { expect, test } from 'bun:test'
import { consumeMails, createTester, executeGraphql, loginToken, rand } from '../../src/tester'
import { emptySchema } from '@contember/schema-utils'

const configureMutation = `mutation {
	configure(config: { passwordless: { enabled: always, url: "https://example.com" } }) { ok }
}`
const initMutation = `mutation($email: String!) {
	initSignInPasswordless(email: $email) { ok }
}`
const inviteMutation = `mutation($email: String!, $projectSlug: String!) {
	invite(email: $email, projectSlug: $projectSlug, memberships: []) {
		ok
		error { code }
	}
}`

type MailhogMessage = { Raw: { To: string[]; Data: string } }

const recipients = (mails: MailhogMessage[]): string[] => mails.flatMap(it => it.Raw.To)

const enablePasswordless = async () => {
	const configure = await executeGraphql('/tenant', configureMutation, {})
	expect(configure.body.data.configure.ok).toBe(true)
}

test('a magic link requested with another spelling of the address goes to the stored address', async () => {
	const tester = await createTester(emptySchema)
	const id = rand()
	const email = `john-${id}@doe.com`
	await tester.tenant.signUp(email, 'HWGA51KKpJ4lSW')
	await enablePasswordless()

	const init = await executeGraphql('/tenant', initMutation, { authorizationToken: loginToken, variables: { email: ` JOHN-${id}@Doe.com ` } })
	expect(init.body.data.initSignInPasswordless.ok).toBe(true)

	const mails: MailhogMessage[] = await consumeMails()
	expect(recipients(mails)).toEqual([email])
	expect(mails[0].Raw.Data).toContain(`email&#x3D;${encodeURIComponent(email)}`)
})

test('a magic link request with whitespace inside the address sends no mail', async () => {
	const tester = await createTester(emptySchema)
	const id = rand()
	await tester.tenant.signUp(`bigjohn-${id}@doe.com`, 'HWGA51KKpJ4lSW')
	await enablePasswordless()

	const init = await executeGraphql('/tenant', initMutation, { authorizationToken: loginToken, variables: { email: `big john-${id}@doe.com` } })
	expect(init.body.data.initSignInPasswordless.ok).toBe(false)
	expect(await consumeMails()).toHaveLength(0)
})

test('an invite of an existing person goes to the stored address', async () => {
	const tester = await createTester(emptySchema)
	const id = rand()
	const email = `john-${id}@doe.com`
	await tester.tenant.signUp(email, 'HWGA51KKpJ4lSW')

	const invite = await executeGraphql('/tenant', inviteMutation, { variables: { email: `JOHN-${id}@Doe.com`, projectSlug: tester.projectSlug } })
	expect(invite.body.data.invite).toEqual({ ok: true, error: null })
	expect(recipients(await consumeMails())).toEqual([email])
})

test('an invite with whitespace inside the address is refused', async () => {
	const tester = await createTester(emptySchema)
	const id = rand()
	await tester.tenant.signUp(`bigjohn-${id}@doe.com`, 'HWGA51KKpJ4lSW')

	const invite = await executeGraphql('/tenant', inviteMutation, { variables: { email: `big john-${id}@doe.com`, projectSlug: tester.projectSlug } })
	expect(invite.body.data.invite).toEqual({ ok: false, error: { code: 'INVALID_EMAIL_FORMAT' } })
	expect(await consumeMails()).toHaveLength(0)
})
