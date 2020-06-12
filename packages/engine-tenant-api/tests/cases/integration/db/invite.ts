import 'jasmine'
import { createTenantTester } from '../../../src/testTenantDb'
import { inviteMutation } from '../mocked/gql/invite'
import { testUuid } from '../../../src/testUuid'
import { GQL } from '../../../src/tags'

it('invites a user with a membership', async () => {
	const tester = await createTenantTester()
	const languageId = testUuid(555)
	const result = await tester.execute(
		inviteMutation({
			email: 'john@doe.com',
			projectSlug: 'blog',
			memberships: [
				{
					role: 'editor',
					variables: [{ name: 'language', values: [languageId] }],
				},
			],
		}),
	)
	expect(result.data.invite.ok).toBeTrue()
	tester.mailer.expectMessage({ subject: 'You have been invited to blog' })
	const identity = result.data.invite.result.person.identity.id
	const resultListMembers = await tester.execute(GQL`
		query {
			projectBySlug(slug: "blog") {
				members {
					identity {
						id
					}
					memberships {
						role
						variables {
							name
							values
						}
					}
				}
			}
		}
	`)
	expect(identity).toEqual(testUuid(2))
	expect(resultListMembers.data).toEqual({
		projectBySlug: {
			members: [
				{
					identity: {
						id: testUuid(2),
					},
					memberships: [
						{
							role: 'editor',
							variables: [
								{
									name: 'language',
									values: [languageId],
								},
							],
						},
					],
				},
			],
		},
	})

	tester.mailer.expectEmpty()
}, 10000)
