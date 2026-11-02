import { base64url, CompactSign } from 'jose'

/**
 * Signs the JWS signing input. A `CryptoKey` signs in-process; a function lets a KMS / HSM sign —
 * for ECDSA it must return the raw `r‖s` signature, not DER.
 */
export type JwsSigner = CryptoKey | ((signingInput: Uint8Array<ArrayBuffer>) => Promise<Uint8Array>)

export interface JwsProtectedHeader {
	readonly alg: string
	readonly [name: string]: unknown
}

export const signCompactJws = async (header: JwsProtectedHeader, payload: Readonly<Record<string, unknown>>, signer: JwsSigner): Promise<string> => {
	const encoder = new TextEncoder()
	if (typeof signer === 'function') {
		const signingInput = `${base64url.encode(JSON.stringify(header))}.${base64url.encode(JSON.stringify(payload))}`
		const signature = await signer(encoder.encode(signingInput))
		return `${signingInput}.${base64url.encode(signature)}`
	}
	return await new CompactSign(encoder.encode(JSON.stringify(payload))).setProtectedHeader(header).sign(signer)
}

const hashSuffixes: Readonly<Record<string, string>> = { 'SHA-256': '256', 'SHA-384': '384', 'SHA-512': '512' }
const curveAlgorithms: Readonly<Record<string, string>> = { 'P-256': 'ES256', 'P-384': 'ES384', 'P-521': 'ES512' }

/** The JWS `alg` of a WebCrypto signing key, or undefined when it has none. */
export const resolveKeyAlgorithm = (key: CryptoKey): string | undefined => {
	const algorithm = key.algorithm
	if (algorithm.name === 'Ed25519') {
		return 'EdDSA'
	}
	if (algorithm.name === 'ECDSA' && 'namedCurve' in algorithm && typeof algorithm.namedCurve === 'string') {
		return curveAlgorithms[algorithm.namedCurve]
	}
	const hashName = 'hash' in algorithm && typeof algorithm.hash === 'object' && algorithm.hash !== null && 'name' in algorithm.hash
		? algorithm.hash.name
		: undefined
	const suffix = typeof hashName === 'string' ? hashSuffixes[hashName] : undefined
	if (suffix === undefined) {
		return undefined
	}
	if (algorithm.name === 'RSASSA-PKCS1-v1_5') {
		return `RS${suffix}`
	}
	if (algorithm.name === 'RSA-PSS') {
		return `PS${suffix}`
	}
	return undefined
}
