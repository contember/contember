import { test, assert } from 'vitest'
import { Acl, Schema } from '@contember/schema'
import { emptySchema } from '@contember/schema-utils'
import { consumeMails, createTester, gql, rand } from '../../src/tester'
import { addProjectMember, invite, signIn, signUp } from '../../src/requests'
import { testUuid } from '@contember/engine-api-tester'
import { c, createSchema } from '@contember/schema-definition'

namespace Model {
	export class Language {
		code = c.stringColumn().unique()
	}

}

const schema = createSchema(Model, schema => ({
	...schema,
	acl: {
		roles: {
			superEditor: {
				stages: '*',
				entities: {},
				tenant: {
					invite: true,
					manage: {
						editor: {
							variables: {
								language: 'language',
							},
						},
					},
				},
				variables: {
					language: {
						type: Acl.VariableType.entity,
						entityName: 'Language',
					},
				},
			},
			editor: {
				stages: '*',
				entities: {},
				variables: {
					language: {
						type: Acl.VariableType.entity,
						entityName: 'Language',
					},
				},
			},
		},
	},
}))

test('admin can invite a user with a membership', async () => {
	const tester = await createTester(schema)
	const email = `john-${rand()}@doe.com`
	const languageId = 'c43e7c51-e138-4e52-95d5-7a41d5c026ee'
	const result = await invite({
		email: email,
		projectSlug: tester.projectSlug,
		memberships: [
			{
				role: 'editor',
				variables: [{ name: 'language', values: [languageId] }],
			},
		],
	})
	assert.isOk(result.body.data.invite.ok)
	const mail = await consumeMails()
	assert.lengthOf(mail, 1)
	assert.equal(mail[0].Content.Headers.Subject[0], 'You have been invited to ' + tester.projectSlug)
	const identity = result.body.data.invite.result.person.identity.id

	await tester(gql`
			query($slug: String!, $email: String!) {
				projectBySlug(slug: $slug) {
					members(input: {filter: {email: [$email]}}) {
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
		`, { variables: { slug: tester.projectSlug, email }, path: '/tenant' })
		.expect(200)
		.expect({
			data: {
				projectBySlug: {
					members: [
						{
							identity: {
								id: identity,
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
			},
		})
})

test('superEditor can invite a user with a membership', async () => {
	const tester = await createTester(schema)
	const email = `john-${rand()}@doe.com`
	const languageId = 'c43e7c51-e138-4e52-95d5-7a41d5c026ee'
	const identityId = await signUp(email)
	const authKey = await signIn(email)
	await addProjectMember(identityId, tester.projectSlug, {
		role: 'superEditor',
		variables: [{ name: 'language', values: [languageId] }],
	})


	const email2 = `john-${rand()}@doe.com`
	const result = await invite({
		email: email2,
		projectSlug: tester.projectSlug,
		memberships: [
			{
				role: 'editor',
				variables: [{ name: 'language', values: [languageId] }],
			},
		],
	}, { authorizationToken: authKey })
	assert.isOk(result.body.data.invite.ok)
	const mail = await consumeMails()
	assert.lengthOf(mail, 1)
	assert.equal(mail[0].Content.Headers.Subject[0], 'You have been invited to ' + tester.projectSlug)
})

test('superEditor cannot invite a user with different variables', async () => {


	const tester = await createTester(schema)
	const email = `john-${rand()}@doe.com`
	const languageId = 'c43e7c51-e138-4e52-95d5-7a41d5c026ee'
	const languageId2 = '75da639f-78c0-4f0f-8c9c-05e7fc5385cf'
	const identityId = await signUp(email)
	const authKey = await signIn(email)
	await addProjectMember(identityId, tester.projectSlug, {
		role: 'superEditor',
		variables: [{ name: 'language', values: [languageId] }],
	})


	const email2 = `john-${rand()}@doe.com`
	const result = await invite({
		email: email2,
		projectSlug: tester.projectSlug,
		memberships: [
			{
				role: 'editor',
				variables: [{ name: 'language', values: [languageId2] }],
			},
		],
	}, { authorizationToken: authKey })
	assert.isNull(result.body.data.invite)
	assert.equal(result.body.errors[0].message, 'You are not allowed to invite a person')
})

test('editor cannot invite a user with a membership', async () => {
	const tester = await createTester(schema)
	const email = `john-${rand()}@doe.com`
	const languageId = 'c43e7c51-e138-4e52-95d5-7a41d5c026ee'
	const identityId = await signUp(email)
	const authKey = await signIn(email)
	await addProjectMember(identityId, tester.projectSlug, {
		role: 'editor',
		variables: [{ name: 'language', values: [languageId] }],
	})


	const email2 = `john-${rand()}@doe.com`
	const result = await invite({
		email: email2,
		projectSlug: tester.projectSlug,
		memberships: [
			{
				role: 'editor',
				variables: [{ name: 'language', values: [languageId] }],
			},
		],
	}, { authorizationToken: authKey })
	assert.isNull(result.body.data.invite)
	assert.equal(result.body.errors[0].message, 'You are not allowed to invite a person')
})
