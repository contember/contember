import { ApiKeyManager } from './apiKey'
import { ConfigurationQuery, PersonQuery, PersonRow } from '../queries'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import { ActivatePasswordlessOtpErrorCode, ConfigPolicy, InitSignInPasswordlessErrorCode, InitSignInPasswordlessResult, SignInPasswordlessErrorCode } from '../../schema'
import { DatabaseContext, validateToken } from '../utils'
import { UserMailer } from '../mailing'
import { ActivateOtpCommand, CreatePersonTokenCommand, IncreaseOtpAttemptCommand, InvalidateTokenCommand } from '../commands'
import { getPreferredProject } from './helpers/getPreferredProject'
import { ProjectManager } from './ProjectManager'
import { PermissionContext } from '../authorization'
import { PersonTokenQuery } from '../queries/personToken/PersonTokenQuery'
import { ImplementationException } from '../../exceptions'
import { OtpAuthenticator } from './OtpAuthenticator'
import { PersonToken } from '../type'
import { AuthLogService } from './AuthLogService'
import { intervalToSeconds } from '../utils/interval'

class PasswordlessSignInManager {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly mailer: UserMailer,
		private readonly projectManager: ProjectManager,
		private readonly otpAuthenticator: OtpAuthenticator,

	) {}

	async initSignInPasswordless({ db, permissionContext, mailVariant, mailProject, email }: {
		db: DatabaseContext
		permissionContext: PermissionContext
		email: string
		mailVariant?: string
		mailProject?: string
	}): Promise<PasswordlessSignInManager.InitSignInPasswordlessResponse> {
		return db.transaction(async (db): Promise<PasswordlessSignInManager.InitSignInPasswordlessResponse> => {
			const configuration = await db.queryHandler.fetch(new ConfigurationQuery())
			if (configuration.passwordless.enabled === 'never') {
				return new ResponseError('PASSWORDLESS_DISABLED', 'Passwordless sign-in is disabled', {
					[AuthLogService.Key]: new AuthLogService.Bag({}),
				})
			}

			const person = await db.queryHandler.fetch(PersonQuery.byEmail(email))
			if (!person) {
				return new ResponseError('PERSON_NOT_FOUND', `Person ${email} not found`, {
					[AuthLogService.Key]: new AuthLogService.Bag({
						personInput: email,
					}),
				})
			}
			if (!this.isEnabled(configuration.passwordless.enabled, person.passwordless_enabled)) {
				return new ResponseError('PASSWORDLESS_DISABLED', 'Passwordless sign-in is disabled for this person', {
					[AuthLogService.Key]: new AuthLogService.Bag({
						personInput: email,
						personId: person.id,
					}),
				})
			}

			const createTokenCommand = CreatePersonTokenCommand.createPasswordlessRequest(person.id, intervalToSeconds(configuration.passwordless.expiration) / 60)
			const result = await db.commandBus.execute(createTokenCommand)


			const url = this.formatUrl(configuration.passwordless.url ?? null, result.token, result.id, email) ?? undefined

			const projects = await this.projectManager.getProjectsByIdentity(db, person.identity_id, permissionContext)
			const project = getPreferredProject(projects, mailProject ?? null)

			await this.mailer.sendPasswordlessEmail(db, {
				email,
				token: result.token,
				url,
				project: project?.name,
				projectSlug: project?.slug,
				requestId: result.id,
			}, {
				variant: mailVariant || '',
				projectId: project?.id ?? null,
			})

			return new ResponseOk({
				requestId: result.id,
				expiresAt: result.expiresAt,
				person,
				[AuthLogService.Key]: new AuthLogService.Bag({
					personInput: email,
					personId: person.id,
					tokenId: result.id,
				}),
			})
		})
	}

	private formatUrl(url: string | null, token: string, requestId: string, email: string): string | null {
		if (!url) {
			return null
		}
		const urlObj = new URL(url)
		urlObj.searchParams.set('token', token)
		urlObj.searchParams.set('request_id', requestId)
		urlObj.searchParams.set('email', email)
		return urlObj.toString()
	}

	async signInPasswordless({ db, expiration, token, requestId, mfaOtp, validationType }: {
		db: DatabaseContext
		validationType: PersonToken.ValidationType
		requestId: string
		token: string
		mfaOtp?: string
		expiration?: number
	}): Promise<PasswordlessSignInManager.SignInPasswordlessResponse> {
		return db.transaction(async (db): Promise<PasswordlessSignInManager.SignInPasswordlessResponse> => {

			const tokenResult = await db.queryHandler.fetch(PersonTokenQuery.byId(requestId, 'passwordless'))
			const tokenValidationResult = validateToken({
				entry: tokenResult,
				token,
				now: db.providers.now(),
				validationType,
			})
			if (!tokenValidationResult.ok) {
				if (tokenValidationResult.error === 'TOKEN_INVALID' && validationType === 'otp') {
					await db.commandBus.execute(new IncreaseOtpAttemptCommand(tokenResult!.id))
				}
				return new ResponseError(tokenValidationResult.error, tokenValidationResult.errorMessage, {
					...tokenValidationResult.metadata ?? {},
					[AuthLogService.Key]: new AuthLogService.Bag({
						personId: tokenResult?.person_id,
						tokenId: tokenResult?.id,
					}),
				})
			}
			if (!tokenResult) {
				throw new ImplementationException()
			}
			const personRow = await db.queryHandler.fetch(PersonQuery.byId(tokenValidationResult.result.person_id))
			if (!personRow) {
				throw new ImplementationException()
			}
			if (personRow.disabled_at !== null) {
				return new ResponseError('PERSON_DISABLED', `Person is disabled`, {
					[AuthLogService.Key]: new AuthLogService.Bag({
						personId: personRow.id,
						tokenId: tokenResult?.id,
					}),
				})
			}

			if (personRow.otp_uri && personRow.otp_activated_at) {
				if (!mfaOtp) {
					return new ResponseError('OTP_REQUIRED', `2FA is enabled. OTP token is required`, {
						[AuthLogService.Key]: new AuthLogService.Bag({
							personId: personRow.id,
							tokenId: tokenResult?.id,
						}),
					})
				}

				if (!this.otpAuthenticator.validate({ uri: personRow.otp_uri }, mfaOtp)) {
					return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed', {
						[AuthLogService.Key]: new AuthLogService.Bag({
							personId: personRow.id,
							tokenId: tokenResult?.id,
						}),
					})
				}
			}

			await db.commandBus.execute(new InvalidateTokenCommand(tokenValidationResult.result.id))
			const sessionToken = await this.apiKeyManager.createSessionApiKey(db, personRow.identity_id, expiration)

			return new ResponseOk({
				person: personRow,
				token: sessionToken,
				[AuthLogService.Key]: new AuthLogService.Bag({
					personId: personRow.id,
					tokenId: tokenResult?.id,
				}),
			})
		})
	}

	async activatePasswordlessOtp({ db, token, requestId, otpHash }: {
		db: DatabaseContext
		requestId: string
		token: string
		otpHash: string
	}): Promise<PasswordlessSignInManager.ActivatePasswordlessOtpResponse> {
		return db.transaction(async (db): Promise<PasswordlessSignInManager.ActivatePasswordlessOtpResponse> => {

			const tokenResult = await db.queryHandler.fetch(PersonTokenQuery.byId(requestId, 'passwordless'))
			const tokenValidationResult = validateToken({
				entry: tokenResult,
				token,
				now: db.providers.now(),
				validationType: 'token',
			})
			if (!tokenValidationResult.ok) {
				return new ResponseError(tokenValidationResult.error, tokenValidationResult.errorMessage, {
					...tokenValidationResult.metadata ?? {},
					[AuthLogService.Key]: new AuthLogService.Bag({
						personId: tokenResult?.person_id,
						tokenId: tokenResult?.id,
					}),
				})
			}

			await db.commandBus.execute(new ActivateOtpCommand(tokenValidationResult.result.id, otpHash))

			return new ResponseOk({
				person: tokenResult?.person_id,
				[AuthLogService.Key]: new AuthLogService.Bag({
					personId: tokenResult?.person_id,
					tokenId: tokenResult?.id,
				}),
			})
		})
	}

	private isEnabled(globalValue: ConfigPolicy, personValue: boolean | null): boolean {
		switch (globalValue) {
			case 'always':
				return true
			case 'never':
				return false
			case 'optIn':
				return personValue === true
			case 'optOut':
				return personValue !== false
		}
	}
}

namespace PasswordlessSignInManager {
	export type InitSignInPasswordlessResponse = Response<InitSignInPasswordlessResult & {
		[AuthLogService.Key]: AuthLogService.Bag
	}, InitSignInPasswordlessErrorCode, {
		[AuthLogService.Key]: AuthLogService.Bag
	}>


	interface SignInPasswordlessResult {
		readonly person: PersonRow
		readonly token: string
		[AuthLogService.Key]: AuthLogService.Bag
	}
	export type SignInPasswordlessResponse = Response<SignInPasswordlessResult, SignInPasswordlessErrorCode, {
		[AuthLogService.Key]: AuthLogService.Bag
	}>

	export type ActivatePasswordlessOtpResponse = Response<{
		[AuthLogService.Key]: AuthLogService.Bag
	}, ActivatePasswordlessOtpErrorCode, {
		[AuthLogService.Key]: AuthLogService.Bag
	}>
}

export { PasswordlessSignInManager }
