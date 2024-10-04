import { ApiKeyManager } from './apiKey'
import { IdentityProviderBySlugQuery, PersonByIdPQuery, PersonQuery, PersonRow } from '../queries'
import { IDPResponse, IDPHandlerRegistry, IDPResponseError, IDPValidationError } from './idp'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { InitSignInIdpErrorCode, InitSignInIdpResult, SignInIdpErrorCode } from '../../schema'
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
		return dbContext.transaction(async (db): Promise<IDPSignInManager.SignInIDPResponse> => {
			const provider = await db.queryHandler.fetch(new IdentityProviderBySlugQuery(idpSlug))
			if (!provider || provider.disabledAt) {
				throw new Error('provider not found')
			}
			const providerService = this.idpRegistry.getHandler(provider.type)
			const validatedConfig = providerService.validateConfiguration(provider.configuration)
			let claim: IDPResponse
			try {
				claim = await providerService.processResponse(
					validatedConfig,
					responseData,
				)
			} catch (e) {
				if (e instanceof IDPResponseError) {
					return new ResponseError('INVALID_IDP_RESPONSE', e.message)
				}
				if (e instanceof IDPValidationError) {
					return new ResponseError('IDP_VALIDATION_FAILED', e.message)
				}
				throw e
			}
			const personRow = await this.resolvePerson(db, claim, provider)

			if (!personRow) {
				return new ResponseError('PERSON_NOT_FOUND', `Person ${claim.email} not found`)
			}

			if (personRow.disabled_at !== null) {
				return new ResponseError('PERSON_DISABLED', `Person with e-mail ${claim.email} is disabled`)
			}

			const sessionToken = await this.apiKeyManager.createSessionApiKey(db, personRow.identity_id, expiration)
			return new ResponseOk({ person: personRow, token: sessionToken, idpResponse: claim })
		})
	}

	async initSignInIDP(dbContext: DatabaseContext, idpSlug: string, data: unknown): Promise<IDPSignInManager.InitSignInIDPResponse> {
		const provider = await dbContext.queryHandler.fetch(new IdentityProviderBySlugQuery(idpSlug))
		if (!provider || provider.disabledAt) {
			return new ResponseError('PROVIDER_NOT_FOUND', `Identity provider ${idpSlug} not found`)
		}
		const providerService = this.idpRegistry.getHandler(provider.type)
		const validatedConfig = providerService.validateConfiguration(provider.configuration)
		try {
			const initResponse = await providerService.initAuth(validatedConfig, data)

			const publicConfig = providerService.getPublicConfiguration
				? providerService.getPublicConfiguration(validatedConfig)
				: validatedConfig

			return new ResponseOk({
				...initResponse,
				idpConfiguration: provider.initReturnsConfig ? publicConfig : null,
			})
		} catch (e) {
			if (e instanceof IDPValidationError) {
				return new ResponseError('IDP_VALIDATION_FAILED', e.message)
			}
			throw e
		}
	}

	private async resolvePerson(db: DatabaseContext, claim: IDPResponse, provider: IdentityProviderRow): Promise<PersonRow | null> {
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

	private async signUp(db: DatabaseContext, { email, name, externalIdentifier }: IDPResponse, provider: IdentityProviderRow): Promise<PersonRow> {
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

	private async saveIdpIdentifier(db: DatabaseContext, provider: IdentityProviderRow, claim: IDPResponse, person: PersonRow) {
		await db.commandBus.execute(new CreatePersonIdentityProviderIdentifierCommand(provider.id, person.id, claim.externalIdentifier))
	}
}

namespace IDPSignInManager {
	export type InitSignInIDPResponse = Response<InitSignInIdpResult, InitSignInIdpErrorCode>

	interface SignInIDPResult {
		readonly person: PersonRow
		readonly token: string
		readonly idpResponse?: Record<string, unknown>
	}

	export type SignInIDPResponse = Response<SignInIDPResult, SignInIdpErrorCode>
}

export { IDPSignInManager }
