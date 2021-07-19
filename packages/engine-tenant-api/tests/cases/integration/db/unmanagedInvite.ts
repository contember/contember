import { dbSuite } from '../../../src/testTenantDb'
import { testUuid } from '../../../src/testUuid'
import { unmanagedInviteMutation } from '../mocked/gql/unmanagedInvite'
import { signInMutation } from '../mocked/gql/signIn'
import { TenantRole } from '../../../../src/model/authorization'
import * as assert from 'uvu/assert'

const inviteSuite = dbSuite('unmanaged invite')

inviteSuite('does not send an email and sets given password', async ({ tester }) => {
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
	assert.equal(result.data.unmanagedInvite, {
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
	assert.equal(signInResult.data.signIn, {
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
})

inviteSuite.run()
