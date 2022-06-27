import { executeGraphql, gql, loginToken } from './tester'
import { assert } from 'vitest'
import { Acl } from '@contember/schema'

export const signIn = async (email: string, password = '123456'): Promise<string> => {
	const response = await executeGraphql(
		'/tenant',
		gql`
			mutation ($email: String!, $password: String!) {
				signIn(email: $email, password: $password) {
					ok
					result {
						token
					}
				}
			}
		`,
		{
			variables: { email, password },
			authorizationToken: loginToken,
		},
	).expect(200)

	return response.body.data.signIn.result.token
}


export const signUp = async (email: string, password = '123456') => {
	const signUpResponse = await executeGraphql(
		'/tenant',
		gql`
			mutation($email: String!, $password: String!) {
				signUp(email: $email, password: $password) {
					ok
					result {
						person {
							identity {
								id
							}
						}
					}
				}
			}
		`,
		{
			variables: { email, password },
		},
	).expect(200)

	return signUpResponse.body.data.signUp.result.person.identity.id
}


export const addProjectMember = async (identityId: string, projectSlug: string, membership: Acl.Membership = { role: 'admin', variables: [] }) => {
	await executeGraphql(
		'/tenant',
		gql`
			mutation ($identity: String!, $projectSlug: String!, $membership: MembershipInput!) {
				addProjectMember(identityId: $identity, projectSlug: $projectSlug, memberships: [$membership]) {
					ok
				}
			}
		`,
		{
			variables: { identity: identityId, projectSlug, membership },
		},
	)
		.expect(200)
		.expect(response => {
			assert.deepStrictEqual(response.body.data, { addProjectMember: { ok: true } })
		})
}
