import { ApiKeyManager } from './apiKey/index.js'
import { IdentityProviderBySlugQuery, PersonByIdPQuery, PersonQuery, PersonRow } from '../queries/index.js'
import { IDPHandlerRegistry, IDPResponse, IDPResponseError, IDPValidationError } from './idp/index.js'
import { Response, ResponseError, ResponseOk } from '../utils/Response.js'
import { InitSignInIdpErrorCode, InitSignInIdpResult, SignInIdpErrorCode } from '../../schema/index.js'
import { DatabaseContext } from '../utils/index.js'
import { ApiKeyRequestInfo, CreateIdentityCommand, CreatePersonCommand, CreatePersonIdentityProviderIdentifierCommand } from '../commands/index.js'
import { CreateIdpSessionCommand } from '../commands/idp/CreateIdpSessionCommand.js'
import { CreateAuthLogEntryCommand } from '../commands/authLog/CreateAuthLogEntryCommand.js'
import { TenantRole } from '../authorization/index.js'
import { NoPassword } from '../dtos/index.js'
import { IdentityProviderRow } from '../queries/idp/types.js'
import { AuthLogService } from './AuthLogService.js'

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
			const resolved = await this.resolvePerson(db, claim, provider)
			const personRow = resolved.person

			if (!personRow) {
				// Keep the external error generic (no account-existence leak), but
				// record the email-verification gate block distinctly in the audit
				// log — it is a takeover-grade event, not an ordinary "not found".
				return new ResponseError('PERSON_NOT_FOUND', `Person ${claim.email} not found`, {
					[AuthLogService.Key]: new AuthLogService.Bag({
						identityProviderId: provider.id,
						personInput: claim.email,
						personId: resolved.blockedPersonId,
						eventData: resolved.blockedReason ? { reason: resolved.blockedReason } : undefined,
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
				} else {
					// Re-validation is enabled on this IdP but no encryption key is configured, so we
					// won't store the token-bearing session — it silently degrades to a plain,
					// non-revalidated session. Audit the downgrade (errorCode `encryption_disabled`)
					// so the operator can see that a session they expected to be continuously
					// re-validated is in fact not protected, instead of failing closed at sign-in.
					await db.commandBus.execute(
						new CreateAuthLogEntryCommand({
							type: 'idp_session_revalidation_failed',
							invokedById: personRow.identity_id,
							personId: personRow.id,
							identityProviderId: provider.id,
							personTokenId: apiKeyId,
							success: true,
							errorCode: 'encryption_disabled',
							ipAddress: requestInfo?.ip,
							userAgent: requestInfo?.userAgent,
						}),
					)
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

	private async resolvePerson(db: DatabaseContext, claim: IDPResponse, provider: IdentityProviderRow): Promise<IDPSignInManager.ResolvePersonResult> {
		const personByIdPQuery = new PersonByIdPQuery(provider.id, claim.externalIdentifier)
		const personByIdp = await db.queryHandler.fetch(personByIdPQuery)
		if (personByIdp) {
			return { person: personByIdp }
		}

		if (!provider.exclusive) {
			const personByEmail = typeof claim.email === 'string' && claim.email
				? await db.queryHandler.fetch(PersonQuery.byEmail(claim.email))
				: null
			if (personByEmail) {
				// Auto-linking an IdP identity to a pre-existing local account by
				// e-mail is takeover-grade: if the provider returns an unverified
				// (or attacker-controlled) e-mail, it could hijack the account. When
				// the provider requires a verified e-mail, refuse to link — and to
				// sign in — unless the address is asserted verified. `assumeEmailVerified`
				// lets a trusted IdP that never emits the claim still satisfy the gate.
				const emailVerified = provider.assumeEmailVerified || claim.emailVerified === true
				if (provider.requireVerifiedEmail && !emailVerified) {
					return { person: null, blockedReason: 'idp_email_unverified', blockedPersonId: personByEmail.id }
				}
				await this.saveIdpIdentifier(db, provider, claim, personByEmail)
				return { person: personByEmail }
			}
		}

		if (provider.autoSignUp) {
			const signedUpPerson = await this.signUp(db, claim, provider)
			await this.saveIdpIdentifier(db, provider, claim, signedUpPerson)
			return { person: signedUpPerson }
		}

		return { person: null }
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
	export type ResolvePersonResult = {
		readonly person: PersonRow | null
		readonly blockedReason?: 'idp_email_unverified'
		readonly blockedPersonId?: string
	}

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
