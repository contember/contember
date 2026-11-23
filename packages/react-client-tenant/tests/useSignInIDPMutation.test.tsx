import { describe, expect, it } from 'bun:test'
import { renderHook } from '@testing-library/react'
import { GraphQlClient, GraphQlClientOptions } from '@contember/graphql-client'
import { ApiBaseUrlContext, GraphQlClientFactoryContext, LoginTokenContext } from '@contember/react-client'
import { buildSchema, graphql, parse, validate } from 'graphql'
import { ReactNode } from 'react'
import { useSignInIDPMutation } from '../src/hooks/mutations/idp/useSignInIdpMutation.js'

// The signInIDP contract of a tenant API released before `SignInIDPResult.idpResponse` (engine < 2.0.0-alpha.19);
// `SignInOptions` arrived even later (2.2.0-alpha.1).
const olderTenantSchema = buildSchema(`
	scalar Json

	type Query {
		me: Person
	}

	type Mutation {
		signInIDP(
			identityProvider: String!
			data: Json
			expiration: Int
			idpResponse: IDPResponseInput @deprecated(reason: "pass idpResponse.url as data.url")
			redirectUrl: String @deprecated(reason: "use data.redirectUrl")
			sessionData: Json @deprecated(reason: "use data.sessionData")
		): SignInIDPResponse
	}

	input IDPResponseInput {
		url: String!
	}

	type SignInIDPResponse {
		ok: Boolean!
		errors: [SignInIDPError!]! @deprecated
		error: SignInIDPError
		result: SignInIDPResult
	}

	type SignInIDPError {
		code: SignInIDPErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum SignInIDPErrorCode {
		INVALID_IDP_RESPONSE
		IDP_VALIDATION_FAILED
		PERSON_NOT_FOUND
		PERSON_DISABLED
		PERSON_ALREADY_EXISTS
	}

	interface CommonSignInResult {
		token: String!
		person: Person!
	}

	type SignInIDPResult implements CommonSignInResult {
		token: String!
		person: Person!
	}

	type Person {
		id: String!
		email: String
		name: String
		otpEnabled: Boolean!
	}
`)

const rootValue = {
	signInIDP: () => ({
		ok: true,
		errors: [],
		error: null,
		result: {
			token: 'session-token',
			person: { id: 'person-1', email: 'jane@example.com', name: 'Jane', otpEnabled: false },
		},
	}),
}

const jsonResponse = (status: number, body: unknown) =>
	new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

// Answers like a GraphQL server: a query the schema rejects gets a 400, a valid one is executed.
const olderTenantApi = async (_input: RequestInfo, init?: RequestInit): Promise<Response> => {
	const { query, variables } = JSON.parse(String(init?.body))
	const errors = validate(olderTenantSchema, parse(query))
	if (errors.length > 0) {
		return jsonResponse(400, { errors: errors.map(it => ({ message: it.message })) })
	}
	return jsonResponse(200, await graphql({ schema: olderTenantSchema, source: query, variableValues: variables, rootValue }))
}

const clientFactory = (options: GraphQlClientOptions) => new GraphQlClient({ ...options, fetcher: olderTenantApi })

const wrapper = ({ children }: { children: ReactNode }) => (
	<ApiBaseUrlContext.Provider value="http://localhost">
		<LoginTokenContext.Provider value="login-token">
			<GraphQlClientFactoryContext.Provider value={clientFactory}>
				{children}
			</GraphQlClientFactoryContext.Provider>
		</LoginTokenContext.Provider>
	</ApiBaseUrlContext.Provider>
)

describe('useSignInIDPMutation', () => {
	it('signs in against a tenant API without SignInIDPResult.idpResponse and SignInOptions', async () => {
		const { result } = renderHook(() => useSignInIDPMutation(), { wrapper })

		const response = await result.current({
			identityProvider: 'mock',
			data: { url: 'http://localhost/?code=abc', redirectUrl: 'http://localhost/' },
		})

		expect(response).toEqual({
			ok: true,
			result: {
				token: 'session-token',
				person: { id: 'person-1', email: 'jane@example.com', name: 'Jane' },
			},
		})
	})
})
