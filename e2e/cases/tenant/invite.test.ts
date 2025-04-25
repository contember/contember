import { test, expect } from 'bun:test'
import { Acl } from '@contember/schema'
import { consumeMails, createTester, rand } from '../../src/tester'
import { c, createSchema } from '@contember/schema-definition'
import * as TenantApi from '@contember/graphql-client-tenant'

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
	const result = await tester.tenant.invite({
		email: email,
		projectSlug: tester.projectSlug,
		memberships: [
			{
				role: 'editor',
				variables: [{ name: 'language', values: [languageId] }],
			},
		],
	})
	expect(result.body.data.invite.ok).toBeTruthy()
	const mail = await consumeMails()
	expect(mail).toHaveLength(1)
	expect(mail[0].Content.Headers.Subject[0]).toBe('You have been invited to ' + tester.projectSlug)
	const identity = result.body.data.invite.result.person.identity.id

	const projectMembersResult = await tester.tenant.send(
		TenantApi.query$
			.projectBySlug(
				TenantApi.project$$.members(
					TenantApi.projectIdentityRelation$
						.identity(TenantApi.identity$$)
						.memberships(TenantApi.membership$$.variables(TenantApi.variableEntry$$)),
				),
			),
		{
			slug: tester.projectSlug,
			input: { filter: { email: [email] } },
		},
	)
	expect(projectMembersResult.status).toBe(200)
	expect(projectMembersResult.body).toMatchObject({
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
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, {
		role: 'superEditor',
		variables: [{ name: 'language', values: [languageId] }],
	})


	const email2 = `john-${rand()}@doe.com`
	const result = await tester.tenant.invite({
		email: email2,
		projectSlug: tester.projectSlug,
		memberships: [
			{
				role: 'editor',
				variables: [{ name: 'language', values: [languageId] }],
			},
		],
	}, { authorizationToken: authKey })
	expect(result.body.data.invite.ok).toBeTruthy()
	const mail = await consumeMails()
	expect(mail).toHaveLength(1)
	expect(mail[0].Content.Headers.Subject[0]).toBe('You have been invited to ' + tester.projectSlug)
})

test('superEditor cannot invite a user with different variables', async () => {


	const tester = await createTester(schema)
	const email = `john-${rand()}@doe.com`
	const languageId = 'c43e7c51-e138-4e52-95d5-7a41d5c026ee'
	const languageId2 = '75da639f-78c0-4f0f-8c9c-05e7fc5385cf'
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, {
		role: 'superEditor',
		variables: [{ name: 'language', values: [languageId] }],
	})


	const email2 = `john-${rand()}@doe.com`
	const result = await tester.tenant.invite({
		email: email2,
		projectSlug: tester.projectSlug,
		memberships: [
			{
				role: 'editor',
				variables: [{ name: 'language', values: [languageId2] }],
			},
		],
	}, {
		authorizationToken: authKey,
		expected: {
			body: {
				errors: [
					{
						message: 'You are not allowed to invite a person',
					},
				],
				data: {
					invite: null,
				},
			},
		},
	})
})

test('editor cannot invite a user with a membership', async () => {
	const tester = await createTester(schema)
	const email = `john-${rand()}@doe.com`
	const languageId = 'c43e7c51-e138-4e52-95d5-7a41d5c026ee'
	const identityId = await tester.tenant.signUp(email)
	const authKey = await tester.tenant.signIn(email)
	await tester.tenant.addProjectMember(identityId, tester.projectSlug, {
		role: 'editor',
		variables: [{ name: 'language', values: [languageId] }],
	})


	const email2 = `john-${rand()}@doe.com`
	await tester.tenant.invite({
		email: email2,
		projectSlug: tester.projectSlug,
		memberships: [
			{
				role: 'editor',
				variables: [{ name: 'language', values: [languageId] }],
			},
		],
	}, {
		authorizationToken: authKey,
		expected: {
			body: {
				errors: [
					{
						message: 'You are not allowed to invite a person',
					},
				],
				data: {
					invite: null,
				},
			},
		},
	})
})

