import { executeGraphql, gql, loginToken } from './tester'
import { Acl } from '@contember/schema'
import { MembershipInput } from '../../packages/engine-tenant-api/src/schema'
import { expect } from 'bun:test'
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
					error {
						code
						developerMessage
						membershipValidation {
							code
							role
							variable
						}
					}
				}
			}
		`,
		{
			variables: { identity: identityId, projectSlug, membership },
		},
	)
		.expect(200)
		.expect(response => {
			expect(response.body.data).toStrictEqual({ addProjectMember: { ok: true, error: null } })
		})
}

export const invite = async (variables: {
	email: string
	projectSlug: string
	memberships: MembershipInput[]
	method?: string
}, { authorizationToken }: {authorizationToken?: string} = {}) => {
	return await executeGraphql(
		'/tenant',
		gql`mutation($email: String!, $projectSlug: String!, $memberships: [MembershipInput!]!, $method: InviteMethod) {
			invite(email: $email, projectSlug: $projectSlug, memberships: $memberships, options: {method: $method}) {
				ok
				errors {
					code
				}
				result {
					person {
						id
						identity {
							id
						}
					}
				}
			}
		}`,
		{ variables, authorizationToken },
	)
}
