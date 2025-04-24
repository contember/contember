import { test } from 'bun:test'
import { createTester, gql, rand } from '../../src/tester'
import { createSchema } from '@contember/schema-definition'
import { Acl } from '@contember/schema'

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
	await tester(gql`
        mutation($email: String!, $projectSlug: String!, $password: String! $memberships: [MembershipInput!]!) {
            unmanagedInvite(email: $email, projectSlug: $projectSlug, memberships: $memberships, password: $password) {
                ok
                errors {
                    code
                }
                result {
                    person {
                        identity {
                            projects {
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
                }
            }
        }
	`, {
		path: '/tenant',
		variables: {
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
	})
		.expect(200)
		.expect({
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
