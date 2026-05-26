import { ApiKeyManager } from './apiKey'
import { IdentityProviderBySlugQuery, PersonByIdPQuery, PersonQuery, PersonRow } from '../queries'
import { IDPHandlerRegistry, IDPResponse, IDPResponseError, IDPValidationError } from './idp'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { InitSignInIdpErrorCode, InitSignInIdpResult, SignInIdpErrorCode } from '../../schema'
import { DatabaseContext } from '../utils'
import { ApiKeyRequestInfo, CreateIdentityCommand, CreatePersonCommand, CreatePersonIdentityProviderIdentifierCommand } from '../commands'
import { CreateIdpSessionCommand } from '../commands/idp/CreateIdpSessionCommand'
import { TenantRole } from '../authorization'
import { NoPassword } from '../dtos'
import { IdentityProviderRow } from '../queries/idp/types'
import { AuthLogService } from './AuthLogService'

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
		requestInfo?: ApiKeyRequestInfo,
		trustForwardedInfo?: boolean,
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
					return new ResponseError('INVALID_IDP_RESPONSE', e.message, {
						[AuthLogService.Key]: new AuthLogService.Bag({
							personId: undefined,
							identityProviderId: provider.id,
						}),
					})
				}
				if (e instanceof IDPValidationError) {
					return new ResponseError('IDP_VALIDATION_FAILED', e.message, {
						[AuthLogService.Key]: new AuthLogService.Bag({
							personId: undefined,
							identityProviderId: provider.id,
						}),
					})
				}
				throw e
			}
			const personRow = await this.resolvePerson(db, claim, provider)

			if (!personRow) {
				return new ResponseError('PERSON_NOT_FOUND', `Person ${claim.email} not found`, {
					[AuthLogService.Key]: new AuthLogService.Bag({
						identityProviderId: provider.id,
						personInput: claim.email,
						personId: undefined,
					}),
				})
			}

			if (personRow.disabled_at !== null) {
				return new ResponseError('PERSON_DISABLED', `Person with e-mail ${claim.email} is disabled`, {
					[AuthLogService.Key]: new AuthLogService.Bag({
						identityProviderId: provider.id,
						personInput: claim.email,
						personId: personRow.id,
					}),
				})
			}

			const { id: apiKeyId, token: sessionToken } = await this.apiKeyManager.createSessionApiKeyWithId(
				db,
				personRow.identity_id,
				expiration,
				requestInfo,
				trustForwardedInfo,
			)

			// Bind the federated-session state to this session so it can be re-validated
			// against the IdP later. Present only when the provider supports it and
			// revalidation is enabled on the IdP configuration (A24). Refresh tokens must be
			// encrypted at rest, so when no encryption key is configured we skip persisting a
			// token-bearing session (it would otherwise crash or store secrets in plaintext) —
			// the session then behaves like a plain session with no re-validation.
			if (claim.idpSession) {
				const hasTokens = !!claim.idpSession.tokens && Object.keys(claim.idpSession.tokens).length > 0
				if (!hasTokens || db.providers.encryptionEnabled) {
					await db.commandBus.execute(new CreateIdpSessionCommand(apiKeyId, provider.id, claim.idpSession))
				}
			}

			return new ResponseOk({
				person: personRow,
				token: sessionToken,
				idpResponse: claim,
				[AuthLogService.Key]: new AuthLogService.Bag({
					personId: personRow.id,
					identityProviderId: provider.id,
					personInput: claim.email,
				}),
			})
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
		const newPerson = await db.commandBus.execute(
			new CreatePersonCommand({
				identityId,
				email: provider.exclusive ? undefined : email,
				password: NoPassword,
				name: name ?? email?.split('@')[0] ?? externalIdentifier,
				idpOnly: provider.exclusive,
			}),
		)

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
		[AuthLogService.Key]: AuthLogService.Bag
	}

	export type SignInIDPResponse = Response<SignInIDPResult, SignInIdpErrorCode, {
		[AuthLogService.Key]: AuthLogService.Bag
	}>
}

export { IDPSignInManager }
