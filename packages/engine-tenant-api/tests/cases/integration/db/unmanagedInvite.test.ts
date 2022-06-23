import { testUuid } from '../../../src/testUuid.js'
import { unmanagedInviteMutation } from '../mocked/gql/unmanagedInvite.js'
import { signInMutation } from '../mocked/gql/signIn.js'
import { TenantRole } from '../../../../src/model/authorization/index.js'
import { test, assert } from 'vitest'
import { testTenantDb } from '../../../src/testTenantDb.js'

test('does not send an email and sets given password', testTenantDb(async ({ tester }) => {
	const languageId = testUuid(555)
	const email = 'john@doe.com'
	const password = 'abcdefg'
	const result = await tester.execute(
		unmanagedInviteMutation({
			email,
			projectSlug: 'blog',
			password,
			memberships: [
				{
					role: 'editor',
					variables: [{ name: 'language', values: [languageId] }],
				},
			],
		}),
	)
	assert.deepStrictEqual(result.data.unmanagedInvite, {
		ok: true,
		errors: [],
		result: {
			person: {
				id: testUuid(3),
				identity: {
					id: testUuid(2),
				},
			},
		},
	})
	tester.mailer.expectEmpty()
	const signInResult = await tester.execute(signInMutation({ email, password }, { withData: true }), {
		roles: [TenantRole.LOGIN],
	})
	assert.deepStrictEqual(signInResult.data.signIn, {
		ok: true,
		errors: [],
		result: {
			token: '3030303030303030303030303030303030303030',
			person: {
				id: result.data.unmanagedInvite.result.person.id,
				identity: {
					projects: [
						{
							project: {
								slug: 'blog',
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
		},
	})
}))
