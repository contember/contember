import { dbSuite } from '../../../src/testTenantDb'
import { inviteMutation } from '../mocked/gql/invite'
import { testUuid } from '../../../src/testUuid'
import { GQL } from '../../../src/tags'
import * as assert from 'uvu/assert'

const inviteSuite = dbSuite('invite permissions')

inviteSuite('admin can invite a user with a membership', async ({ tester }) => {
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
	assert.is(result.data.invite.ok, true)
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
	assert.is(identity, testUuid(2))
	assert.equal(resultListMembers.data, {
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
})

inviteSuite('superEditor can invite a user with a membership', async ({ tester }) => {
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
		{
			membership: {
				role: 'superEditor',
				variables: [{ name: 'language', values: [languageId] }],
			},
		},
	)
	assert.is(result.data.invite.ok, true)
})

inviteSuite('superEditor cannot invite a user with different variables', async ({ tester }) => {
	const languageId = testUuid(555)
	const languageId2 = testUuid(556)
	const result = await tester.execute(
		inviteMutation({
			email: 'john@doe.com',
			projectSlug: 'blog',
			memberships: [
				{
					role: 'editor',
					variables: [{ name: 'language', values: [languageId2] }],
				},
			],
		}),
		{
			membership: {
				role: 'superEditor',
				variables: [{ name: 'language', values: [languageId] }],
			},
		},
	)
	assert.is(result.errors[0].message, 'You are not allowed to invite a person')
})

inviteSuite('editor cannot invite a user with a membership', async ({ tester }) => {
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
		{
			membership: {
				role: 'editor',
				variables: [{ name: 'language', values: [languageId] }],
			},
		},
	)
	assert.is(result.errors[0].message, 'You are not allowed to invite a person')
})

inviteSuite.run()
