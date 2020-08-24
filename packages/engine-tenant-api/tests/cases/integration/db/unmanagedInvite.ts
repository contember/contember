import 'jasmine'
import { createTenantTester } from '../../../src/testTenantDb'
import { testUuid } from '../../../src/testUuid'
import { unmanagedInviteMutation } from '../mocked/gql/unmanagedInvite'
import { signInMutation } from '../mocked/gql/signIn'
import { TenantRole } from '../../../../src/model/authorization'

describe('unmanaged invite', () => {
	it('does not send an email and sets given password', async () => {
		const tester = await createTenantTester()
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
		expect(result.data.unmanagedInvite).toEqual({
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
		expect(signInResult.data.signIn).toEqual({
			ok: true,
			errors: [],
			result: {
				token: '0000000000000000000000000000000000000000',
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
		await tester.end()
	}, 10000)
})
