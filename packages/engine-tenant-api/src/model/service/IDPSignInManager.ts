import { ApiKeyManager } from './apiKey'
import { IdentityProviderBySlugQuery, PersonQuery, PersonRow } from '../queries'
import { IDPClaim, IDPHandlerRegistry, IDPResponse, IDPResponseError, IDPValidationError } from './idp'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { InitSignInIdpErrorCode, SignInIdpErrorCode } from '../../schema'
import { DatabaseContext } from '../utils'
import { CreateIdentityCommand, CreatePersonCommand } from '../commands'
import { TenantRole } from '../authorization'
import { ImplementationException } from '../../exceptions'
import { NoPassword } from '../dtos'

class IDPSignInManager {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly idpRegistry: IDPHandlerRegistry,
	) {}

	async signInIDP(
		dbContext: DatabaseContext,
		idpSlug: string,
		redirectUrl: string,
		idpResponse: IDPResponse,
		sessionData: any,
		expiration?: number,
	): Promise<IDPSignInManager.SignInIDPResponse> {
		return dbContext.transaction(async db => {
			const provider = await db.queryHandler.fetch(new IdentityProviderBySlugQuery(idpSlug))
			if (!provider || provider.disabledAt) {
				throw new Error('provider not found')
			}
			const providerService = this.idpRegistry.getHandler(provider.type)
			const validatedConfig = providerService.validateConfiguration(provider.configuration)
			let claim: IDPClaim
			try {
				claim = await providerService.processResponse(
					validatedConfig,
					redirectUrl,
					idpResponse,
					sessionData,
				)
			} catch (e) {
				if (e instanceof IDPResponseError) {
					return new ResponseError(SignInIdpErrorCode.InvalidIdpResponse, e.message)
				}
				if (e instanceof IDPValidationError) {
					return new ResponseError(SignInIdpErrorCode.IdpValidationFailed, e.message)
				}
				throw e
			}
			let personRow = await db.queryHandler.fetch(PersonQuery.byEmail(claim.email))
			if (!personRow) {
				if (!provider.autoSignUp) {
					return new ResponseError(SignInIdpErrorCode.PersonNotFound, `Person ${claim.email} not found`)
				}
				const roles = [TenantRole.PERSON]
				const identityId = await db.commandBus.execute(new CreateIdentityCommand(roles))
				const newPerson = await db.commandBus.execute(new CreatePersonCommand(identityId, claim.email, NoPassword))
				personRow = {
					...newPerson,
					roles,
				}
			}
			if (!personRow) {
				throw new ImplementationException()
			}

			const sessionToken = await this.apiKeyManager.createSessionApiKey(db, personRow.identity_id, expiration)
			return new ResponseOk({ person: personRow, token: sessionToken })
		})
	}

	async initSignInIDP(dbContext: DatabaseContext, idpSlug: string, redirectUrl: string): Promise<IDPSignInManager.InitSignInIDPResponse> {
		const provider = await dbContext.queryHandler.fetch(new IdentityProviderBySlugQuery(idpSlug))
		if (!provider || provider.disabledAt) {
			return new ResponseError(InitSignInIdpErrorCode.ProviderNotFound, `Identity provider ${idpSlug} not found`)
		}
		const providerService = this.idpRegistry.getHandler(provider.type)
		const validatedConfig = providerService.validateConfiguration(provider.configuration)
		const initResponse = await providerService.initAuth(validatedConfig, redirectUrl)
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
