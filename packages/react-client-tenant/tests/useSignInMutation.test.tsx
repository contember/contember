import { describe, expect, it } from 'bun:test'
import { renderHook } from '@testing-library/react'
import { buildSchema } from 'graphql'
import { useSignInMutation } from '../src/hooks/mutations/auth/useSignInMutation.js'
import { useCreateSessionTokenMutation } from '../src/hooks/mutations/apiKey/useCreateSessionTokenMutation.js'
import { createTenantApiWrapper } from './tenantApiMock.js'

// The signIn and createSessionToken contract of tenant APIs released before 2.2, trimmed from the tenant SDL of engines
// 2.0.12 and 2.1.0-rc.8. 2.0 has no `SignInError.retryAfter`; neither has `backupCode`, `SignInOptions` nor
// `SignInResult.backupCodes`.
const olderSignInSdl = (signInErrorExtraFields: string) => `
	type Query {
		me: Person
	}

	type Mutation {
		signIn(email: String!, password: String!, expiration: Int, otpToken: String): SignInResponse
		createSessionToken(email: String, personId: String, expiration: Int): CreateSessionTokenResponse
	}

	type SignInResponse {
		ok: Boolean!
		errors: [SignInError!]! @deprecated
		error: SignInError
		result: SignInResult
	}

	type SignInError {
		code: SignInErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
		${signInErrorExtraFields}
	}

	enum SignInErrorCode {
		UNKNOWN_EMAIL
		INVALID_PASSWORD
		PERSON_DISABLED
		NO_PASSWORD_SET
		OTP_REQUIRED
		INVALID_OTP_TOKEN
	}

	interface CommonSignInResult {
		token: String!
		person: Person!
	}

	type SignInResult implements CommonSignInResult {
		token: String!
		person: Person!
	}

	type CreateSessionTokenResponse {
		ok: Boolean!
		error: CreateSessionTokenError
		result: CreateSessionTokenResult
	}

	type CreateSessionTokenError {
		code: CreateSessionTokenErrorCode!
		developerMessage: String!
	}

	enum CreateSessionTokenErrorCode {
		UNKNOWN_EMAIL
		UNKNOWN_PERSON_ID
		PERSON_DISABLED
	}

	type CreateSessionTokenResult implements CommonSignInResult {
		token: String!
		person: Person!
	}

	type Person {
		id: String!
		email: String
		name: String
		otpEnabled: Boolean!
	}
`

const olderEngines = [
	{ version: '2.0.x', schema: buildSchema(olderSignInSdl('')) },
	{ version: '2.1.x', schema: buildSchema(olderSignInSdl('retryAfter: Int')) },
]

// The same operations on a current (2.2) engine.
const currentSchema = buildSchema(`
	type Query {
		me: Person
	}

	type Mutation {
		signIn(email: String!, password: String!, expiration: Int, otpToken: String, backupCode: String, options: SignInOptions): SignInResponse
		createSessionToken(email: String, personId: String, expiration: Int, options: SignInOptions): CreateSessionTokenResponse
	}

	input SignInOptions {
		trustForwardedClientInfo: Boolean
	}

	type SignInResponse {
		ok: Boolean!
		error: SignInError
		result: SignInResult
	}

	type SignInError {
		code: String!
		developerMessage: String!
		retryAfter: Int
	}

	type SignInResult {
		token: String!
		person: Person!
		backupCodes: [String!]
	}

	type CreateSessionTokenResponse {
		ok: Boolean!
		error: CreateSessionTokenError
		result: CreateSessionTokenResult
	}

	type CreateSessionTokenError {
		code: String!
		developerMessage: String!
	}

	type CreateSessionTokenResult {
		token: String!
		person: Person!
	}

	type Person {
		id: String!
		email: String
		name: String
	}
`)

const person = { id: 'person-1', email: 'jane@example.com', name: 'Jane', otpEnabled: false }

const rootValue = {
	signIn: ({ password }: { password: string }) =>
		password === 'secret-password'
			? { ok: true, errors: [], error: null, result: { token: 'session-token', person } }
			: {
				ok: false,
				errors: [],
				error: { code: 'INVALID_PASSWORD', developerMessage: 'Invalid password', endUserMessage: null },
				result: null,
			},
	createSessionToken: () => ({ ok: true, error: null, result: { token: 'created-token', person } }),
}

const signedIn = { ok: true, result: { token: 'session-token', person: { id: 'person-1', email: 'jane@example.com', name: 'Jane' } } }

describe.each(olderEngines)('against the tenant API of a $version engine', ({ schema }) => {
	it('signs in with a password', async () => {
		const { wrapper } = createTenantApiWrapper(schema, rootValue)
		const { result } = renderHook(() => useSignInMutation(), { wrapper })

		const response = await result.current({ email: 'jane@example.com', password: 'secret-password', expiration: 60 })

		expect(response).toEqual(signedIn)
	})

	it('reports a sign-in error', async () => {
		const { wrapper } = createTenantApiWrapper(schema, rootValue)
		const { result } = renderHook(() => useSignInMutation(), { wrapper })

		const response = await result.current({ email: 'jane@example.com', password: 'wrong-password', otpToken: '123456' })

		expect(response).toEqual({ ok: false, error: 'INVALID_PASSWORD', developerMessage: 'Invalid password' })
	})

	it('creates a session token', async () => {
		const { wrapper } = createTenantApiWrapper(schema, rootValue)
		const { result } = renderHook(() => useCreateSessionTokenMutation({ apiToken: 'api-token' }), { wrapper })

		const response = await result.current({ email: 'jane@example.com', expiration: 60 })

		expect(response).toEqual({
			ok: true,
			result: { token: 'created-token', person: { id: 'person-1', email: 'jane@example.com', name: 'Jane' } },
		})
	})
})

describe('against the tenant API of a current engine', () => {
	it('sends backupCode and options only when the caller sets them', async () => {
		const { wrapper, requests } = createTenantApiWrapper(currentSchema, rootValue)
		const { result } = renderHook(() => useSignInMutation(), { wrapper })

		expect(await result.current({ email: 'jane@example.com', password: 'secret-password' })).toEqual(signedIn)
		const withNewerArguments = await result.current({
			email: 'jane@example.com',
			password: 'secret-password',
			backupCode: 'backup-code',
			options: { trustForwardedClientInfo: true },
		})

		expect(withNewerArguments).toEqual(signedIn)
		expect(requests[0].query).not.toContain('backupCode')
		expect(requests[0].query).not.toContain('SignInOptions')
		expect(requests[1].query).toContain('$backupCode')
		expect(requests[1].query).toContain('SignInOptions')
		expect(requests[1].variables).toMatchObject({ backupCode: 'backup-code', options: { trustForwardedClientInfo: true } })
	})

	it('sends createSessionToken options only when the caller sets them', async () => {
		const { wrapper, requests } = createTenantApiWrapper(currentSchema, rootValue)
		const { result } = renderHook(() => useCreateSessionTokenMutation(), { wrapper })

		await result.current({ personId: 'person-1' })
		const response = await result.current({ personId: 'person-1', options: { trustForwardedClientInfo: true } })

		expect(response.ok).toBe(true)
		expect(requests[0].query).not.toContain('SignInOptions')
		expect(requests[1].query).toContain('SignInOptions')
		expect(requests[1].variables).toMatchObject({ options: { trustForwardedClientInfo: true } })
	})
})
