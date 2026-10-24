import { createHash } from 'node:crypto'
import { calculateJwkThumbprint, EmbeddedJWK, jwtVerify, JWTVerifyResult } from 'jose'
import { ExpiringSet } from './ExpiringSet.js'

export type DpopFailureCategory = 'dpop_missing' | 'dpop_invalid' | 'dpop_binding' | 'dpop_replay'

export interface DpopFailure {
	readonly category: DpopFailureCategory
	readonly message: string
}

export interface DpopProofInput {
	/** Every `DPoP` header value of the request. */
	readonly proofs: readonly string[]
	readonly accessToken: string
	/** `cnf.jkt` of the verified access token. */
	readonly jkt: string
	readonly method: string
	readonly url: string
	readonly algorithms: readonly string[]
	readonly now: Date
}

/** RFC 9449 §4.3: `iat` of a proof is accepted within this many seconds of now, and its `jti` is remembered as long. */
export const DPOP_PROOF_WINDOW_SECONDS = 60

const MAX_PROOF_LENGTH = 8 * 1024
const MAX_JTI_LENGTH = 256
const MAX_REMEMBERED_PROOFS = 100_000
const JWT_SHAPE = /^[\w-]+\.[\w-]+\.[\w-]+$/

const failure = (category: DpopFailureCategory, message: string): DpopFailure => ({ category, message })

const normalizeHtu = (value: string): string | null => {
	try {
		const url = new URL(value)
		url.search = ''
		url.hash = ''
		return url.href
	} catch {
		return null
	}
}

export const accessTokenHash = (token: string): string => createHash('sha256').update(token).digest('base64url')

/**
 * Verifies the DPoP proof of a bound token (§8a). The `jti` replay cache is per worker: without a shared store a
 * captured proof can be replayed against another worker within the window, which `DPoP-Nonce` closes later.
 */
export class DpopProofVerifier {
	// Refusing when full keeps replay protection intact; only authenticated holders of a bound token can fill it.
	private readonly seenProofs = new ExpiringSet(MAX_REMEMBERED_PROOFS, 'refuse')

	public async verify(input: DpopProofInput): Promise<DpopFailure | null> {
		if (input.proofs.length === 0) {
			return failure('dpop_missing', 'The token is bound, but the request carries no DPoP proof')
		}
		if (input.proofs.length > 1) {
			return failure('dpop_invalid', 'The request carries more than one DPoP header')
		}
		const proof = input.proofs[0]
		if (proof.length > MAX_PROOF_LENGTH || !JWT_SHAPE.test(proof)) {
			return failure('dpop_invalid', 'The DPoP proof is not a compact JWS')
		}

		let verified: JWTVerifyResult
		try {
			verified = await jwtVerify(proof, EmbeddedJWK, {
				typ: 'dpop+jwt',
				algorithms: [...input.algorithms],
				currentDate: input.now,
			})
		} catch (e) {
			return failure('dpop_invalid', `The DPoP proof does not verify: ${e instanceof Error ? e.message : String(e)}`)
		}
		const { payload, protectedHeader } = verified
		if (protectedHeader.jwk === undefined) {
			return failure('dpop_invalid', 'The DPoP proof carries no jwk header')
		}
		if (await calculateJwkThumbprint(protectedHeader.jwk, 'sha256') !== input.jkt) {
			return failure('dpop_binding', 'The DPoP proof key does not match cnf.jkt of the token')
		}
		if (payload.htm !== input.method) {
			return failure('dpop_invalid', 'The DPoP proof htm does not match the request method')
		}
		const htu = typeof payload.htu === 'string' ? normalizeHtu(payload.htu) : null
		if (htu === null || htu !== normalizeHtu(input.url)) {
			return failure('dpop_invalid', 'The DPoP proof htu does not match the request URL')
		}
		if (payload.ath !== accessTokenHash(input.accessToken)) {
			return failure('dpop_invalid', 'The DPoP proof ath does not match the access token')
		}
		const nowSeconds = Math.floor(input.now.getTime() / 1000)
		const iat = payload.iat
		if (typeof iat !== 'number' || Math.abs(nowSeconds - iat) > DPOP_PROOF_WINDOW_SECONDS) {
			return failure('dpop_invalid', 'The DPoP proof iat is missing or outside the accepted window')
		}
		const jti = payload.jti
		if (typeof jti !== 'string' || jti === '' || jti.length > MAX_JTI_LENGTH) {
			return failure('dpop_invalid', 'The DPoP proof jti is missing or invalid')
		}
		const expiresAt = (iat + DPOP_PROOF_WINDOW_SECONDS + 1) * 1000
		const remembered = this.seenProofs.add(`${input.jkt}\n${jti}`, expiresAt, input.now.getTime())
		if (remembered === 'present') {
			return failure('dpop_replay', 'The DPoP proof was already used')
		}
		if (remembered === 'full') {
			return failure('dpop_replay', 'The DPoP replay cache is full')
		}
		return null
	}
}
