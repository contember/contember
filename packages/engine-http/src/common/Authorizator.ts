import { ApiKeyManager, DatabaseContext, VerifyResult } from '@contember/engine-tenant-api'
import { Timer } from './TimerMiddleware'
import { HttpError } from './HttpError'
import { Request } from 'koa'

export type AuthResult =
	& VerifyResult
	& { assumedIdentityId?: string }

export interface AuthMiddlewareState {
	authResult: AuthResult
}

const assumeIdentityHeader = 'x-contember-assume-identity'

export class Authenticator {
	private createAuthError = (message: string) => new HttpError(`Authorization failure: ${message}`, 401)

	constructor(
		private readonly tenantDatabase: DatabaseContext,
		private readonly apiKeyManager: ApiKeyManager,
	) {
	}

	public async authenticate({ request, timer }: { request: Request; timer: Timer }): Promise<AuthResult> {
		const authHeader = request.get('Authorization')
		if (typeof authHeader !== 'string' || authHeader === '') {
			throw this.createAuthError(`Authorization header is missing`)
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
		return {
			...authResult.result,
			assumedIdentityId: request.get(assumeIdentityHeader) || undefined,
		}
	}
}
