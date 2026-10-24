import { decodeJwt, JWTPayload } from 'jose'

/** Caches a token until 80 % of its `iat`–`exp` lifetime and shares one in-flight fetch between concurrent callers. */
export class TokenCache {
	private cached: { readonly token: string; readonly refreshAtMs: number } | undefined
	private pending: Promise<string> | undefined

	constructor(
		private readonly source: string,
		private readonly fetchToken: () => Promise<string>,
	) {}

	get(refresh: boolean): Promise<string> {
		if (refresh) {
			this.cached = undefined
		} else if (this.cached !== undefined && Date.now() < this.cached.refreshAtMs) {
			return Promise.resolve(this.cached.token)
		}
		this.pending ??= this.fetch().finally(() => {
			this.pending = undefined
		})
		return this.pending
	}

	private async fetch(): Promise<string> {
		const token = await this.fetchToken()
		const { iat, exp } = decodeClaims(this.source, token)
		if (typeof iat !== 'number' || typeof exp !== 'number' || exp <= iat) {
			throw new Error(`${this.source}: the token has no valid numeric "iat" and "exp" claims.`)
		}
		this.cached = { token, refreshAtMs: (iat + (exp - iat) * 0.8) * 1000 }
		return token
	}
}

const decodeClaims = (source: string, token: string): JWTPayload => {
	try {
		return decodeJwt(token)
	} catch (cause) {
		throw new Error(`${source}: the token is not a JWT.`, { cause })
	}
}
