import { ApiKeyManager } from '../service'
import { IdentityProviderQuery, PersonQuery, PersonRow } from '../queries'
import { IDPManager, IDPResponse, IDPResponseError, IDPValidationError } from './idp'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { InitSignInIdpErrorCode, SignInIdpErrorCode } from '../../schema'
import { DatabaseContext } from '../utils'

class IDPSignInManager {
	constructor(
		private readonly dbContext: DatabaseContext,
		private readonly apiKeyManager: ApiKeyManager,
		private readonly idpManager: IDPManager,
	) {}

	async signInIDP(
		idpSlug: string,
		redirectUrl: string,
		idpResponse: IDPResponse,
		sessionData: any,
		expiration?: number,
	): Promise<IDPSignInManager.SignInIDPResponse> {
		const provider = await this.dbContext.queryHandler.fetch(new IdentityProviderQuery(idpSlug))
		if (!provider) {
			throw new Error('provider not found')
		}
		try {
			const claim = await this.idpManager.processResponse(
				provider.type,
				provider.configuration,
				redirectUrl,
				idpResponse,
				sessionData,
			)
			const personRow = await this.dbContext.queryHandler.fetch(PersonQuery.byEmail(claim.email))
			if (!personRow) {
				return new ResponseError(SignInIdpErrorCode.PersonNotFound, `Person ${claim.email} not found`)
			}

			const sessionToken = await this.apiKeyManager.createSessionApiKey(personRow.identity_id, expiration)
			return new ResponseOk({ person: personRow, token: sessionToken })
		} catch (e) {
			if (e instanceof IDPResponseError) {
				return new ResponseError(SignInIdpErrorCode.InvalidIdpResponse, e.message)
			}
			if (e instanceof IDPValidationError) {
				return new ResponseError(SignInIdpErrorCode.IdpValidationFailed, e.message)
			}
			throw e
		}
	}

	async initSignInIDP(idpSlug: string, redirectUrl: string): Promise<IDPSignInManager.InitSignInIDPResponse> {
		const provider = await this.dbContext.queryHandler.fetch(new IdentityProviderQuery(idpSlug))
		if (!provider) {
			return new ResponseError(InitSignInIdpErrorCode.ProviderNotFound, `IDP provider ${idpSlug} was not found`)
		}
		const initResponse = await this.idpManager.initAuth(provider.type, provider.configuration, redirectUrl)
		return new ResponseOk(initResponse)
	}
}

namespace IDPSignInManager {
	export interface InitSignInIDPResult {
		readonly authUrl: string
		readonly sessionData: any
	}

	export type InitSignInIDPResponse = Response<InitSignInIDPResult, InitSignInIdpErrorCode>

	interface SignInIDPResult {
		readonly person: PersonRow
		readonly token: string
	}

	export type SignInIDPResponse = Response<SignInIDPResult, SignInIdpErrorCode>
}

export { IDPSignInManager }
