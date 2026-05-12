import { ApiKeyManager, DatabaseContext, VerifyResult } from '@contember/engine-tenant-api'
import { HttpErrorResponse } from './HttpResponse'
import { Timer } from '../application'
import { IncomingMessage } from 'node:http'

export type AuthResult =
	& VerifyResult
	& {
		assumedIdentityId?: string
		clientIp?: string
		clientUserAgent?: string
		forwarderIp?: string
		forwarderUserAgent?: string
	}

const assumeIdentityHeader = 'x-contember-assume-identity'
const forwardedClientIpHeader = 'x-contember-client-ip'
const forwardedClientUserAgentHeader = 'x-contember-client-user-agent'

const readHeader = (request: IncomingMessage, name: string): string | undefined => {
	const value = request.headers[name]
	if (Array.isArray(value)) {
		return value[0]
	}
	return typeof value === 'string' ? value : undefined
}

export class Authenticator {
	private createAuthError = (message: string) => new HttpErrorResponse(401, `Authorization failure: ${message}`)

	constructor(
		private readonly tenantDatabase: DatabaseContext,
		private readonly tenantReadDatabase: DatabaseContext,
		private readonly apiKeyManager: ApiKeyManager,
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
		const socketUserAgent = readHeader(request, 'user-agent')
		const forwardedIp = readHeader(request, forwardedClientIpHeader)
		const forwardedUserAgent = readHeader(request, forwardedClientUserAgentHeader)
		const socketInfo = { ip: clientIp, userAgent: socketUserAgent }
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
		return {
			...authResult.result,
			assumedIdentityId,
			clientIp: trustForwarded ? (forwardedInfo?.ip ?? clientIp) : clientIp,
			clientUserAgent: trustForwarded ? (forwardedInfo?.userAgent ?? socketUserAgent) : socketUserAgent,
			forwarderIp: trustForwarded ? clientIp : undefined,
			forwarderUserAgent: trustForwarded ? socketUserAgent : undefined,
		}
	}
}
