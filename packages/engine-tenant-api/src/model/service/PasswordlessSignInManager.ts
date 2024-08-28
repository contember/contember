import { ApiKeyManager } from './apiKey'
import { PersonQuery, PersonRow } from '../queries'
import { Response, ResponseError, ResponseOk } from '../utils/Response'
import {
	ActivatePasswordlessOtpErrorCode,
	ConfigPolicy,
	InitSignInPasswordlessErrorCode,
	InitSignInPasswordlessResult,
	SignInPasswordlessErrorCode,
} from '../../schema'
import { DatabaseContext, validateToken } from '../utils'
import { ConfigurationManager } from './ConfigurationManager'
import { UserMailer } from '../mailing'
import { ActivateOtpCommand, CreatePersonTokenCommand, IncreaseOtpAttemptCommand } from '../commands'
import { getPreferredProject } from './helpers/getPreferredProject'
import { ProjectManager } from './ProjectManager'
import { PermissionContext } from '../authorization'
import { PersonTokenQuery } from '../queries/personToken/PersonTokenQuery'
import { ImplementationException } from '../../exceptions'
import { OtpAuthenticator } from './OtpAuthenticator'
import { InvalidateTokenCommand } from '../commands/personToken/InvalidateTokenCommand'
import { PersonToken } from '../type'

class PasswordlessSignInManager {
	constructor(
		private readonly apiKeyManager: ApiKeyManager,
		private readonly configurationManager: ConfigurationManager,
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
			const configuration = await this.configurationManager.fetchConfiguration(db)
			if (configuration.passwordless.enabled === 'never') {
				return new ResponseError('PASSWORDLESS_DISABLED', 'Passwordless sign-in is disabled')
			}

			const person = await db.queryHandler.fetch(PersonQuery.byEmail(email))
			if (!person) {
				return new ResponseError('PERSON_NOT_FOUND', `Person ${email} not found`)
			}
			if (!this.isEnabled(configuration.passwordless.enabled, person.passwordless_enabled)) {
				return new ResponseError('PASSWORDLESS_DISABLED', 'Passwordless sign-in is disabled for this person')
			}

			const createTokenCommand = CreatePersonTokenCommand.createPasswordlessRequest(person.id, configuration.passwordless.expirationMinutes)
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
			}, {
				variant: mailVariant || '',
				projectId: project?.id ?? null,
			})

			return new ResponseOk({ requestId: result.id, expiresAt: result.expiresAt })
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
				return tokenValidationResult
			}
			const personRow = await db.queryHandler.fetch(PersonQuery.byId(tokenValidationResult.result.person_id))
			if (!personRow) {
				throw new ImplementationException()
			}
			if (personRow.disabled_at !== null) {
				return new ResponseError('PERSON_DISABLED', `Person is disabled`)
			}

			if (personRow.otp_uri && personRow.otp_activated_at) {
				if (!mfaOtp) {
					return new ResponseError('OTP_REQUIRED', `2FA is enabled. OTP token is required`)
				}

				if (!this.otpAuthenticator.validate({ uri: personRow.otp_uri }, mfaOtp)) {
					return new ResponseError('INVALID_OTP_TOKEN', 'OTP token validation has failed')
				}
			}

			await db.commandBus.execute(new InvalidateTokenCommand(tokenValidationResult.result.id))
			const sessionToken = await this.apiKeyManager.createSessionApiKey(db, personRow.identity_id, expiration)

			return new ResponseOk({ person: personRow, token: sessionToken })
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
				return tokenValidationResult
			}

			await db.commandBus.execute(new ActivateOtpCommand(tokenValidationResult.result.id, otpHash))

			return new ResponseOk(null)
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
	export type InitSignInPasswordlessResponse = Response<InitSignInPasswordlessResult, InitSignInPasswordlessErrorCode>


	interface SignInPasswordlessResult {
		readonly person: PersonRow
		readonly token: string
	}
	export type SignInPasswordlessResponse = Response<SignInPasswordlessResult, SignInPasswordlessErrorCode>

	export type ActivatePasswordlessOtpResponse = Response<null, ActivatePasswordlessOtpErrorCode>
}

export { PasswordlessSignInManager }
