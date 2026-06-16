import { ApiKeyManager, DatabaseContext, VerifyResult } from '@contember/engine-tenant-api'
import { HttpErrorResponse } from './HttpResponse.js'
import { Timer } from '../application/index.js'
import { IncomingMessage } from 'node:http'
import ipaddr from 'ipaddr.js'

export type AuthResult =
	& VerifyResult
	& {
		assumedIdentityId?: string
		clientIp?: string
		clientUserAgent?: string
		forwarderIp?: string
		forwarderUserAgent?: string
		/** A03: client country from the trusted reverse-proxy geo header, when configured + trusted. */
		geoCountry?: string
	}

const assumeIdentityHeader = 'x-contember-assume-identity'
const forwardedClientIpHeader = 'x-contember-client-ip'
const forwardedClientUserAgentHeader = 'x-contember-client-user-agent'

const USER_AGENT_MAX_LENGTH = 512
// A03: cap the trusted country header so a misbehaving/overlong upstream value
// can never bloat the auth-log row. A country code is 2 chars; allow some slack
// for names/regions but keep it bounded.
const GEO_COUNTRY_MAX_LENGTH = 64

const readHeader = (request: IncomingMessage, name: string): string | undefined => {
	const value = request.headers[name]
	if (Array.isArray(value)) {
		return value[0]
	}
	return typeof value === 'string' ? value : undefined
}

const sanitizeGeoCountry = (value: string | undefined): string | undefined => {
	if (value === undefined) {
		return undefined
	}
	const trimmed = value.trim()
	if (trimmed.length === 0) {
		return undefined
	}
	return trimmed.length > GEO_COUNTRY_MAX_LENGTH ? trimmed.slice(0, GEO_COUNTRY_MAX_LENGTH) : trimmed
}

const sanitizeUserAgent = (value: string | undefined): string | undefined => {
	if (value === undefined) {
		return undefined
	}
	return value.length > USER_AGENT_MAX_LENGTH ? value.slice(0, USER_AGENT_MAX_LENGTH) : value
}

const sanitizeIp = (value: string | undefined): string | undefined => {
	if (!value) {
		return undefined
	}
	try {
		ipaddr.parse(value)
	} catch {
		return undefined
	}
	return value
}

export class Authenticator {
	private createAuthError = (message: string) => new HttpErrorResponse(401, `Authorization failure: ${message}`)

	constructor(
		private readonly tenantDatabase: DatabaseContext,
		private readonly tenantReadDatabase: DatabaseContext,
		private readonly apiKeyManager: ApiKeyManager,
		/** A03: configured trusted geo-country header name (lower-cased), or undefined when the feature is off. */
		private readonly geoCountryHeader?: string,
	) {
	}

	public async authenticate(
		{ request, timer, clientIp }: { request: IncomingMessage; timer: Timer; clientIp?: string },
	): Promise<AuthResult | null> {
		const authHeader = request.headers.authorization
		if (!authHeader) {
			return null
		}

		const authHeaderPattern = /^Bearer\s+(\w+)$/i

		const match = authHeader.match(authHeaderPattern)
		if (match === null) {
			throw this.createAuthError(`invalid Authorization header format`)
		}
		const [, token] = match
		const socketIp = sanitizeIp(clientIp)
		const socketUserAgent = sanitizeUserAgent(readHeader(request, 'user-agent'))
		const forwardedIp = sanitizeIp(readHeader(request, forwardedClientIpHeader))
		const forwardedUserAgent = sanitizeUserAgent(readHeader(request, forwardedClientUserAgentHeader))
		// Header lookup is case-insensitive: Node lower-cases all incoming header
		// names, so the configured name is lower-cased to match.
		const forwardedGeoCountry = this.geoCountryHeader !== undefined
			? sanitizeGeoCountry(readHeader(request, this.geoCountryHeader.toLowerCase()))
			: undefined
		const socketInfo = { ip: socketIp, userAgent: socketUserAgent }
		const forwardedInfo = (forwardedIp !== undefined || forwardedUserAgent !== undefined)
			? { ip: forwardedIp, userAgent: forwardedUserAgent }
			: undefined
		const authResult = await timer(
			'Auth',
			() => this.apiKeyManager.verifyAndProlong(this.tenantDatabase, this.tenantReadDatabase, token, socketInfo, forwardedInfo),
		)
		if (!authResult.ok) {
			throw this.createAuthError(authResult.errorMessage)
		}
		const assumedIdentityId = request.headers[assumeIdentityHeader] ?? undefined
		if (Array.isArray(assumedIdentityId)) {
			throw new HttpErrorResponse(400, `Invalid ${assumedIdentityId} header format`)
		}
		const trustForwarded = authResult.result.trustForwardedInfo && forwardedInfo !== undefined
		// A03: the geo country is only ever exposed under the exact same gate as the
		// forwarded IP/UA — a trusted key that actually forwarded client info. This
		// keeps the signals consistent: we never score a real client country against
		// the proxy's own socket IP (which is what `clientIp` falls back to when no
		// forwarded info was sent). An untrusted key, or one that forwarded nothing,
		// yields no country.
		const trustGeo = trustForwarded && forwardedGeoCountry !== undefined
		return {
			...authResult.result,
			assumedIdentityId,
			clientIp: trustForwarded ? (forwardedInfo?.ip ?? socketIp) : socketIp,
			clientUserAgent: trustForwarded ? (forwardedInfo?.userAgent ?? socketUserAgent) : socketUserAgent,
			forwarderIp: trustForwarded ? socketIp : undefined,
			forwarderUserAgent: trustForwarded ? socketUserAgent : undefined,
			geoCountry: trustGeo ? forwardedGeoCountry : undefined,
		}
	}
}
