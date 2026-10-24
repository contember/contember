import { CredentialsProvider } from '@contember/graphql-client'

export interface TestIssuerOptions {
	/** Signing algorithm of the issuer key (default `RS256`). */
	readonly alg?: 'RS256' | 'ES256'
	/** Host name in the issuer URL (default `localhost`); the server always listens on loopback. */
	readonly hostname?: string
}

export interface TestIssuerMintOptions {
	/** Overrides or removes (`undefined`) protected header members, e.g. `{ typ: undefined }`. */
	readonly header?: Readonly<Record<string, unknown>>
	/** Sign with a key the JWKS does not publish. */
	readonly foreignKey?: boolean
}

export interface TestIssuer {
	/** `http://<hostname>:<port>`; serves discovery and the JWKS. */
	readonly issuer: string
	readonly jwksUri: string
	/** Signs exactly these claims (nothing is added), for crafting valid and invalid tokens. */
	mint(claims: Readonly<Record<string, unknown>>, options?: TestIssuerMintOptions): Promise<string>
	/** A `selfIssued` provider signing with this issuer's key. */
	credentials(
		options: { readonly subject: string; readonly audience: string; readonly lifetime?: number; readonly dpop?: boolean },
	): CredentialsProvider
	close(): Promise<void>
}

/** A key plus discovery and JWKS on a random loopback port, for engine e2e and adopters' tests. */
export const createTestIssuer = async (options?: TestIssuerOptions): Promise<TestIssuer> => {
	throw new Error('not implemented')
}
