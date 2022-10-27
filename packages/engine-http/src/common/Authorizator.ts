import { ApiKeyManager, DatabaseContext, VerifyResult } from '@contember/engine-tenant-api'
import { HttpErrorResponse } from './HttpResponse'
import { Timer } from '../application'
import { IncomingMessage } from 'http'

export type AuthResult =
	& VerifyResult
	& { assumedIdentityId?: string }

const assumeIdentityHeader = 'x-contember-assume-identity'

export class Authenticator {
	private createAuthError = (message: string) => new HttpErrorResponse(401, `Authorization failure: ${message}`)

	constructor(
		private readonly tenantDatabase: DatabaseContext,
		private readonly apiKeyManager: ApiKeyManager,
	) {
	}

	public async authenticate({ request, timer }: { request: IncomingMessage; timer: Timer }): Promise<AuthResult | null> {
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
		const authResult = await timer('Auth', () => this.apiKeyManager.verifyAndProlong(this.tenantDatabase, token))
		if (!authResult.ok) {
			throw this.createAuthError(authResult.errorMessage)
		}
		const assumedIdentityId = request.headers[assumeIdentityHeader] ?? undefined
		if (Array.isArray(assumedIdentityId)) {
			throw new HttpErrorResponse(400, `Invalid ${assumedIdentityId} header format`)
		}
		return {
			...authResult.result,
			assumedIdentityId,
		}
	}
}
