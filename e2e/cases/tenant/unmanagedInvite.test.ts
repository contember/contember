import { test, expect } from 'bun:test'
import { createTester, rand } from '../../src/tester'
import { createSchema } from '@contember/schema-definition'
import { Acl } from '@contember/schema'
import * as TenantApi from '@contember/graphql-client-tenant'

namespace Model {
	export class Language {
	}
}

const schema = createSchema(Model, schema => ({
	...schema,
	acl: {
		roles: {
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

test('does not send an email and sets given password', async () => {
	const tester = await createTester(schema)
	const email = `john-${rand()}@doe.com`
	const languageId = 'c43e7c51-e138-4e52-95d5-7a41d5c026ee'
	const password = 'HWGA51KKpJ4lSW'

	const inviteResult = await tester.tenant.send(
		TenantApi.mutation$
			.unmanagedInvite(
				TenantApi.inviteResponse$$
					.errors(TenantApi.inviteError$$)
					.result(
						TenantApi.inviteResult$
							.person(
								TenantApi.person$
									.identity(
										TenantApi.identity$
											.projects(
												TenantApi.identityProjectRelation$
													.memberships(TenantApi.membership$$.variables(TenantApi.variableEntry$$)),
											),
									),
							),
					),
			),
		{
			email,
			password,
			projectSlug: tester.projectSlug,
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
	)

	expect(inviteResult.status).toBe(200)
	expect(inviteResult.body).toEqual({
		data: {
			unmanagedInvite: {
				ok: true,
				errors: [],
				result: {
					person: {
						identity: {
							projects: [
								{
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
				},
			},
		},
	})
})

