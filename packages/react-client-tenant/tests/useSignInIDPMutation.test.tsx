import { describe, expect, it } from 'bun:test'
import { renderHook } from '@testing-library/react'
import { buildSchema } from 'graphql'
import { useSignInIDPMutation } from '../src/hooks/mutations/idp/useSignInIdpMutation.js'
import { createTenantApiWrapper } from './tenantApiMock.js'

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

const { wrapper } = createTenantApiWrapper(olderTenantSchema, rootValue)

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
