import { ApiKeyManager } from './apiKey'
import { IdentityProviderBySlugQuery, PersonByIdPQuery, PersonQuery, PersonRow } from '../queries'
import { IDPClaim, IDPHandlerRegistry, IDPResponseError, IDPValidationError } from './idp'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { InitSignInIdpErrorCode, SignInIdpErrorCode } from '../../schema'
import { DatabaseContext } from '../utils'
import { CreateIdentityCommand, CreatePersonCommand, CreatePersonIdentityProviderIdentifierCommand } from '../commands'
import { TenantRole } from '../authorization'
import { NoPassword } from '../dtos'
import { IdentityProviderRow } from '../queries/idp/types'

class IDPSignInManager {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly idpRegistry: IDPHandlerRegistry,
	) {}

	async signInIDP(
		dbContext: DatabaseContext,
		idpSlug: string,
		responseData: unknown,
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
					responseData,
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
			const personRow = await this.resolvePerson(db, claim, provider)

			if (!personRow) {
				return new ResponseError(SignInIdpErrorCode.PersonNotFound, `Person ${claim.email} not found`)
			}

			if (personRow.disabled_at !== null) {
				return new ResponseError(SignInIdpErrorCode.PersonDisabled, `Person with e-mail ${claim.email} is disabled`)
			}

			const sessionToken = await this.apiKeyManager.createSessionApiKey(db, personRow.identity_id, expiration)
			return new ResponseOk({ person: personRow, token: sessionToken })
		})
	}

	async initSignInIDP(dbContext: DatabaseContext, idpSlug: string, data: unknown): Promise<IDPSignInManager.InitSignInIDPResponse> {
		const provider = await dbContext.queryHandler.fetch(new IdentityProviderBySlugQuery(idpSlug))
		if (!provider || provider.disabledAt) {
			return new ResponseError(InitSignInIdpErrorCode.ProviderNotFound, `Identity provider ${idpSlug} not found`)
		}
		const providerService = this.idpRegistry.getHandler(provider.type)
		const validatedConfig = providerService.validateConfiguration(provider.configuration)
		try {
			const initResponse = await providerService.initAuth(validatedConfig, data)
			return new ResponseOk(initResponse)
		} catch (e) {
			if (e instanceof IDPValidationError) {
				return new ResponseError(InitSignInIdpErrorCode.IdpValidationFailed, e.message)
			}
			throw e
		}
	}

	private async resolvePerson(db: DatabaseContext, claim: IDPClaim, provider: IdentityProviderRow): Promise<PersonRow | null> {
		const personByIdPQuery = new PersonByIdPQuery(provider.id, claim.externalIdentifier)
		const personByIdp = await db.queryHandler.fetch(personByIdPQuery)
		if (personByIdp) {
			return personByIdp
		}

		if (!provider.exclusive) {
			const personByEmail = claim.email ? await db.queryHandler.fetch(PersonQuery.byEmail(claim.email)) : null
			if (personByEmail) {
				await this.saveIdpIdentifier(db, provider, claim, personByEmail)
				return personByEmail
			}
		}

		if (provider.autoSignUp) {
			const signedUpPerson = await this.signUp(db, claim, provider)
			await this.saveIdpIdentifier(db, provider, claim, signedUpPerson)
			return signedUpPerson
		}

		return null
	}

	private async signUp(db: DatabaseContext, { email, name, externalIdentifier }: IDPClaim, provider: IdentityProviderRow): Promise<PersonRow> {
		const roles = [TenantRole.PERSON]
		const identityId = await db.commandBus.execute(new CreateIdentityCommand(roles))
		const newPerson = await db.commandBus.execute(new CreatePersonCommand({
			identityId,
			email: provider.exclusive ? undefined : email,
			password: NoPassword,
			name: name ?? email?.split('@')[0] ?? externalIdentifier,
			idpOnly: provider.exclusive,
		}))

		return {
			...newPerson,
			roles,
		}
	}

	private async saveIdpIdentifier(db: DatabaseContext, provider: IdentityProviderRow, claim: IDPClaim, person: PersonRow) {
		await db.commandBus.execute(new CreatePersonIdentityProviderIdentifierCommand(provider.id, person.id, claim.externalIdentifier))
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
