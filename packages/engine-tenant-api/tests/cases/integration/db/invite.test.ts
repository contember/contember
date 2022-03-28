import { testTenantDb } from '../../../src/testTenantDb'
import { inviteMutation } from '../mocked/gql/invite'
import { testUuid } from '../../../src/testUuid'
import { GQL } from '../../../src/tags'
import { test, assert } from 'vitest'


test('admin can invite a user with a membership', testTenantDb(async ({ tester }) => {
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
	assert.isOk(result.data.invite.ok)
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
	assert.equal(identity, testUuid(2))
	assert.deepStrictEqual(resultListMembers.data, {
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
}))

test('superEditor can invite a user with a membership', testTenantDb(async ({ tester }) => {
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
	assert.equal(result.data.invite.ok, true)
}))

test('superEditor cannot invite a user with different variables', testTenantDb(async ({ tester }) => {
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
			noErrorsCheck: true,
		},
	)
	assert.equal(result.errors[0].message, 'You are not allowed to invite a person')
}))

test('editor cannot invite a user with a membership', testTenantDb(async ({ tester }) => {
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
			noErrorsCheck: true,
		},
	)
	assert.equal(result.errors[0].message, 'You are not allowed to invite a person')
}))
