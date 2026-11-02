import { expect } from 'bun:test'
import { createTestIssuer, TestIssuer } from '@contember/workload-identity/testing'
import { executeGraphql } from './tester.js'

/**
 * Host the engine fetches the test issuer's JWKS from. The issuer listens on 127.0.0.1 only, so the default suits an
 * engine on the same host (CI) and avoids `localhost` resolving to ::1; the issuer URL stays `localhost`, only compared.
 */
const jwksHost = process.env.CONTEMBER_E2E_WORKLOAD_ISSUER_HOST || '127.0.0.1'

export interface E2eIssuer {
	readonly issuer: TestIssuer
	/** The JWKS URL as the engine reaches it. */
	readonly jwksUri: string
	/** Signs a token with valid defaults (`iat` now, 5 min lifetime, a fresh `jti`); `claims` override them. */
	mintToken(claims: { readonly sub: string; readonly aud: string } & Readonly<Record<string, unknown>>): Promise<string>
}

export const startTestIssuer = async (): Promise<E2eIssuer> => {
	const issuer = await createTestIssuer()
	const jwksUri = new URL(issuer.jwksUri)
	jwksUri.hostname = jwksHost
	return {
		issuer,
		jwksUri: jwksUri.toString(),
		mintToken: async claims => {
			const now = nowSeconds()
			return await issuer.mint({ iss: issuer.issuer, iat: now, exp: now + 300, jti: crypto.randomUUID(), ...claims })
		},
	}
}

export const nowSeconds = () => Math.floor(Date.now() / 1000)

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const trustFields = `
	id
	slug
	disabled
	tokensValidAfter
	identity { id kind }
`

const applyMutation = `mutation($slug: String!, $trust: WorkloadIdentityTrustInput!) {
	applyWorkloadIdentityTrust(slug: $slug, trust: $trust) {
		ok
		error { code developerMessage details }
		result {
			created
			tokensValidAfterBumped
			trust { ${trustFields} }
		}
	}
}`

const disableMutation = `mutation($slug: String!) {
	disableWorkloadIdentityTrust(slug: $slug) { ok error { code } }
}`

const checkQuery = `query($token: String!) {
	checkWorkloadIdentityToken(token: $token) {
		ok
		trust { slug }
		failure { step conditionIndex actualValue }
		requiresDpop
	}
}`

export interface AppliedTrust {
	readonly created: boolean
	readonly tokensValidAfterBumped: boolean
	readonly trust: {
		readonly id: string
		readonly slug: string
		readonly disabled: boolean
		readonly tokensValidAfter: string
		readonly identity: { readonly id: string; readonly kind: string }
	}
}

/** Raw `applyWorkloadIdentityTrust` response body; the caller's token defaults to the root token. */
export const applyTrustRequest = async (slug: string, trust: Record<string, unknown>, authorizationToken?: string) =>
	await executeGraphql('/tenant', applyMutation, { variables: { slug, trust }, authorizationToken })

export const applyTrust = async (slug: string, trust: Record<string, unknown>): Promise<AppliedTrust> => {
	const response = await applyTrustRequest(slug, trust)
	expect(response.status).toBe(200)
	expect(response.body.data.applyWorkloadIdentityTrust).toMatchObject({ ok: true, error: null })
	return response.body.data.applyWorkloadIdentityTrust.result
}

export const disableTrustRequest = async (slug: string, authorizationToken?: string) =>
	await executeGraphql('/tenant', disableMutation, { variables: { slug }, authorizationToken })

export const disableTrust = async (slug: string) => {
	const response = await disableTrustRequest(slug)
	expect(response.body.data.disableWorkloadIdentityTrust).toStrictEqual({ ok: true, error: null })
}

export const checkToken = async (token: string) => {
	const response = await executeGraphql('/tenant', checkQuery, { variables: { token } })
	expect(response.status).toBe(200)
	return response.body.data.checkWorkloadIdentityToken
}

/** §8.7: every JWT-branch failure is the same 401. */
export const expectInvalidToken = (
	response: { status: number; headers: Record<string, string>; body: unknown },
	scheme: 'Bearer' | 'DPoP' = 'Bearer',
) => {
	expect({ status: response.status, wwwAuthenticate: response.headers['www-authenticate'], body: response.body }).toStrictEqual({
		status: 401,
		wwwAuthenticate: `${scheme} error="invalid_token"`,
		body: { errors: [{ code: 401, message: 'Authorization failure: invalid token' }] },
	})
}
