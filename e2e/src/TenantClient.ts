import { Fetcher, TextWriter, util } from 'graphql-ts-client-api'
import * as TenantApi from '@contember/graphql-client-tenant'
import { MembershipInput } from '@contember/graphql-client-tenant'
import { expect } from 'bun:test'
import { Acl } from '@contember/schema'

export class TenantClient {
	constructor(
		private readonly apiUrl: string,
		private readonly rootToken: string,
	) {
	}

	async send<TData extends object, TVariables extends object>(fetcher: Fetcher<'Query' | 'Mutation', TData, TVariables>, variables?: TVariables, options?: {
		authorizationToken?: string
	}): Promise<{
		status: number
		headers: Headers
		body?: {
			data?: TData
			errors?: Array<{ message: string }>
		}
	}> {
		const writer = new TextWriter()
		writer.text(`${fetcher.fetchableType.name.toLowerCase()}`)
		if (fetcher.variableTypeMap.size !== 0) {
			writer.scope({ type: 'ARGUMENTS', multiLines: fetcher.variableTypeMap.size > 2, suffix: ' ' }, () => {
				util.iterateMap(fetcher.variableTypeMap, ([name, type]) => {
					writer.seperator()
					writer.text(`$${name}: ${type}`)
				})
			})
		}
		writer.text(fetcher.toString())
		writer.text(fetcher.toFragmentString())

		const response = await fetch(this.apiUrl + '/tenant', {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				'x-foot': 'bar',
				'Authorization': `Bearer ${options?.authorizationToken ?? this.rootToken}`,
			},
			body: JSON.stringify({
				query: writer.toString(),
				variables,
			}),
		})
		let json
		try {
			json = await response.json()
		} catch (e) {
			// ignore
		}
		return {
			status: response.status,
			headers: response.headers,
			body: json,
		}
	}

	signIn = async (email: string, password = 'HWGA51KKpJ4lSW'): Promise<string> => {
		const response = await this.send(TenantApi.mutation$
			.signIn(TenantApi
				.signInResponse$$
				.error(TenantApi.signInError$$)
				.result(TenantApi.signInResult$$),
			), {
			email,
			password,
		})

		expect(response).toMatchObject({
			status: 200,
			body: {
				data: {
					signIn: {
						ok: true,
						error: null,
					},
				},
			},
		})


		return response.body.data.signIn.result.token
	}


	signUp = async (email: string, password = 'HWGA51KKpJ4lSW') => {
		const signUpResponse = await this.send(TenantApi.mutation$
			.signUp(TenantApi
				.signUpResponse$$
				.error(TenantApi.signUpError$$)
				.result(TenantApi
					.signUpResult$
					.person(TenantApi
						.person$$
						.identity(TenantApi.identity$$),
					),
				),
			), {
			email,
			password,
		})

		expect(signUpResponse).toMatchObject({
			status: 200,
			body: {
				data: {
					signUp: {
						ok: true,
						error: null,
					},
				},
			},
		})

		return signUpResponse.body.data.signUp.result.person.identity.id
	}


	addProjectMember = async (identityId: string, projectSlug: string, membership: Acl.Membership = { role: 'admin', variables: [] }) => {
		const response = await this.send(TenantApi.mutation$
			.addProjectMember(TenantApi
				.addProjectMemberResponse$$
				.error(TenantApi.addProjectMemberError$$),
			), {
			identityId,
			projectSlug,
			memberships: [membership],
		})
		expect(response).toMatchObject({
			status: 200,
			body: {
				data: {
					addProjectMember: {
						ok: true,
						error: null,
					},
				},
			},
		})
	}

	invite = async (variables: {
		email: string
		projectSlug: string
		memberships: MembershipInput[]
		method?: string
	}, { authorizationToken, expected }: { authorizationToken?: string; expected?: object } = {}) => {
		const response = await this.send(TenantApi.mutation$
			.invite(TenantApi
				.inviteResponse$$
				.error(TenantApi.inviteError$$)
				.result(TenantApi
					.inviteResult$
					.person(TenantApi
						.person$$
						.identity(TenantApi.identity$$),
					),
				)), variables, { authorizationToken },
		)
		expect(response).toMatchObject(expected ?? {
			status: 200,
			body: {
				data: {
					invite: {
						ok: true,
						error: null,
					},
				},
			},
		})

		return response
	}

	createProject = async (slug: string) => {
		const response = await this.send(TenantApi.mutation$
			.createProject(TenantApi
				.createProjectResponse$$
				.error(TenantApi.createProjectResponseError$$),
			), {
			projectSlug: slug,
			config: {},
		})
		expect(response).toMatchObject({
			status: 200,
			body: {
				data: {
					createProject: {
						ok: true,
						error: null,
					},
				},
			},
		})
	}
}
