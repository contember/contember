import { CredentialsProvider } from '@contember/graphql-client'

export type { CredentialsProvider, CredentialsRequest } from '@contember/graphql-client'

export interface GithubActionsOptions {
	/** The trust's audience; requested from the GitHub OIDC endpoint per token. */
	readonly audience: string
	/** Defaults to `process.env`; reads `ACTIONS_ID_TOKEN_REQUEST_URL` / `ACTIONS_ID_TOKEN_REQUEST_TOKEN`. */
	readonly env?: Readonly<Record<string, string | undefined>>
	readonly fetch?: (input: string, init?: RequestInit) => Promise<Response>
}

/** Tokens from the GitHub Actions OIDC endpoint; never written to env or disk. */
export const githubActions = (options: GithubActionsOptions): CredentialsProvider => {
	throw new Error('not implemented')
}

export interface KubernetesOptions {
	/** Path of the projected service account token file. */
	readonly path: string
}

/** Reads the projected token file; the kubelet rotates it, `refresh` re-reads it. */
export const kubernetes = (options: KubernetesOptions): CredentialsProvider => {
	throw new Error('not implemented')
}

/**
 * Signs the JWS signing input. A `CryptoKey` signs in-process; a function lets a KMS / HSM sign —
 * for ECDSA it must return the raw `r‖s` signature, not DER.
 */
export type JwsSigner = CryptoKey | ((signingInput: Uint8Array) => Promise<Uint8Array>)

export interface SelfIssuedOptions {
	readonly issuer: string
	readonly subject: string
	readonly audience: string
	readonly signer: JwsSigner
	/** JWS algorithm, e.g. `ES256`; required when `signer` is a function. */
	readonly alg?: string
	readonly kid: string
	/** Token lifetime in seconds (default 300). */
	readonly lifetime?: number
	/** Bind tokens to an ephemeral non-extractable key and send a DPoP proof per request (§8a). */
	readonly dpop?: boolean
	/** Extra claims; `iss` / `sub` / `aud` / `iat` / `exp` / `jti` / `cnf` cannot be overridden. */
	readonly claims?: Readonly<Record<string, unknown>>
}

/** Mints tokens in-process for a backend that is its own issuer. */
export const selfIssued = (options: SelfIssuedOptions): CredentialsProvider => {
	throw new Error('not implemented')
}

export interface IssuerHandlerOptions {
	readonly issuer: string
	/** Public JWKs (each with `kid` and `alg`) currently published; private members are rejected. */
	readonly keys: readonly JsonWebKey[]
}

/** A fetch-style handler serving `/.well-known/openid-configuration` and the JWKS; other paths answer 404. */
export const issuerHandler = (options: IssuerHandlerOptions): (request: Request) => Promise<Response> => {
	throw new Error('not implemented')
}
