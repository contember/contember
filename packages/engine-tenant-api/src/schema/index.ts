/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }
import { Interval } from './types.js'
import { OutputInterval } from './types.js'
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: { input: string; output: string }
	String: { input: string; output: string }
	Boolean: { input: boolean; output: boolean }
	Int: { input: number; output: number }
	Float: { input: number; output: number }
	DateTime: { input: Date; output: Date }
	/**  Interval is a string in the format ISO 8601, e.g. "PT1H" for 1 hour  */
	Interval: { input: Interval; output: OutputInterval }
	Json: { input: unknown; output: unknown }
}

export type ActivatePasswordlessOtpError = {
	readonly __typename?: 'ActivatePasswordlessOtpError'
	readonly code: ActivatePasswordlessOtpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ActivatePasswordlessOtpErrorCode =
	| 'TOKEN_EXPIRED'
	| 'TOKEN_INVALID'
	| 'TOKEN_NOT_FOUND'
	| 'TOKEN_USED'

export type ActivatePasswordlessOtpResponse = {
	readonly __typename?: 'ActivatePasswordlessOtpResponse'
	readonly error?: Maybe<ActivatePasswordlessOtpError>
	readonly ok: Scalars['Boolean']['output']
}

export type AddGlobalIdentityRolesError = {
	readonly __typename?: 'AddGlobalIdentityRolesError'
	readonly code: AddGlobalIdentityRolesErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type AddGlobalIdentityRolesErrorCode =
	| 'IDENTITY_NOT_FOUND'
	| 'INVALID_ROLE'

export type AddGlobalIdentityRolesResponse = {
	readonly __typename?: 'AddGlobalIdentityRolesResponse'
	readonly error?: Maybe<AddGlobalIdentityRolesError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<AddGlobalIdentityRolesResult>
}

export type AddGlobalIdentityRolesResult = {
	readonly __typename?: 'AddGlobalIdentityRolesResult'
	readonly identity: Identity
}

export type AddIdpError = {
	readonly __typename?: 'AddIDPError'
	readonly code: AddIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type AddIdpErrorCode =
	| 'ALREADY_EXISTS'
	| 'INVALID_CONFIGURATION'
	| 'UNKNOWN_TYPE'

export type AddIdpResponse = {
	readonly __typename?: 'AddIDPResponse'
	readonly error?: Maybe<AddIdpError>
	readonly ok: Scalars['Boolean']['output']
}

export type AddMailTemplateError = {
	readonly __typename?: 'AddMailTemplateError'
	readonly code: AddMailTemplateErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type AddMailTemplateErrorCode =
	| 'INVALID_REPLY_EMAIL_FORMAT'
	| 'MISSING_VARIABLE'
	| 'PROJECT_NOT_FOUND'

export type AddMailTemplateResponse = {
	readonly __typename?: 'AddMailTemplateResponse'
	readonly error?: Maybe<AddMailTemplateError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<AddMailTemplateError>
	readonly ok: Scalars['Boolean']['output']
}

export type AddProjectMemberError = {
	readonly __typename?: 'AddProjectMemberError'
	readonly code: AddProjectMemberErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
	readonly membershipValidation?: Maybe<ReadonlyArray<MembershipValidationError>>
}

export type AddProjectMemberErrorCode =
	| 'ALREADY_MEMBER'
	| 'IDENTITY_NOT_FOUND'
	| 'INVALID_MEMBERSHIP'
	| 'PROJECT_NOT_FOUND'
	| 'ROLE_NOT_FOUND'
	| 'VARIABLE_EMPTY'
	| 'VARIABLE_NOT_FOUND'

export type AddProjectMemberResponse = {
	readonly __typename?: 'AddProjectMemberResponse'
	readonly error?: Maybe<AddProjectMemberError>
	readonly errors: ReadonlyArray<AddProjectMemberError>
	readonly ok: Scalars['Boolean']['output']
}

export type ApiKey = {
	readonly __typename?: 'ApiKey'
	readonly createdAt?: Maybe<Scalars['DateTime']['output']>
	/**  Human-readable label, stored on the key's identity (`identity.description`).  */
	readonly description?: Maybe<Scalars['String']['output']>
	/**  False once the key has been disabled (`disableApiKey`).  */
	readonly enabled?: Maybe<Scalars['Boolean']['output']>
	readonly expiresAt?: Maybe<Scalars['DateTime']['output']>
	readonly id: Scalars['String']['output']
	readonly identity: Identity
	readonly lastUsedAt?: Maybe<Scalars['DateTime']['output']>
	readonly type?: Maybe<ApiKeyType>
}

export type ApiKeyType =
	| 'ONE_OFF'
	| 'PERMANENT'
	| 'SESSION'

export type ApiKeyWithToken = {
	readonly __typename?: 'ApiKeyWithToken'
	readonly id: Scalars['String']['output']
	readonly identity: Identity
	readonly token?: Maybe<Scalars['String']['output']>
}

/**
 * A single `person_auth_log` row. Mirrors the columns described in
 * docs/.../audit-log.md.
 */
export type AuthLogEntry = {
	readonly __typename?: 'AuthLogEntry'
	readonly createdAt: Scalars['DateTime']['output']
	readonly errorCode?: Maybe<Scalars['String']['output']>
	readonly errorMessage?: Maybe<Scalars['String']['output']>
	/**
	 * JSONB — domain payload. For change events this is typically
	 * `{before, after}`; for creation events it's the snapshot.
	 * Secret-bearing inputs are redacted before being stored.
	 */
	readonly eventData?: Maybe<Scalars['Json']['output']>
	readonly id: Scalars['String']['output']
	readonly identityProviderId?: Maybe<Scalars['String']['output']>
	/**
	 * Identity that performed the action. May be null for entries created
	 * before this column was populated, or when the actor's identity was
	 * later deleted (FK is ON DELETE SET NULL semantics-wise).
	 */
	readonly invokedByIdentityId?: Maybe<Scalars['String']['output']>
	/**
	 * Effective client IP after `trust-forwarded-info` is applied. The
	 * raw socket peer is preserved in `metadata.forwarderIp` when a
	 * trusted proxy was involved.
	 */
	readonly ipAddress?: Maybe<Scalars['String']['output']>
	/**
	 * JSONB — forensic context. Common keys: `forwarderIp`,
	 * `forwarderUserAgent`, `sessionId`, `reason`.
	 */
	readonly metadata?: Maybe<Scalars['Json']['output']>
	/** The actor's person (if the actor was a person, not a bare api_key). */
	readonly personId?: Maybe<Scalars['String']['output']>
	/**
	 * Free-form input string — typically the email submitted on a failed
	 * login, before any person record was looked up.
	 */
	readonly personInputIdentifier?: Maybe<Scalars['String']['output']>
	readonly success: Scalars['Boolean']['output']
	/**
	 * The subject of the action when different from the actor (e.g. force
	 * sign-out, role grant, membership change). Resolved from the affected
	 * identity so the trail points at the right person even when the actor
	 * acts on someone else's identity.
	 */
	readonly targetPersonId?: Maybe<Scalars['String']['output']>
	/**
	 * One of the values listed in `auth_log_type` (see audit-log docs).
	 * Kept as String rather than a GraphQL enum because a few legacy values
	 * (`2fa_enable`, `2fa_disable`) start with a digit and aren't valid
	 * enum names, and the set is expected to keep growing.
	 */
	readonly type: Scalars['String']['output']
	readonly userAgent?: Maybe<Scalars['String']['output']>
}

/** All fields are AND-combined. Omitted fields are unconstrained. */
export type AuthLogFilter = {
	/** Inclusive lower bound (`created_at >= createdAfter`). */
	readonly createdAfter?: InputMaybe<Scalars['DateTime']['input']>
	/** Exclusive upper bound (`created_at < createdBefore`). */
	readonly createdBefore?: InputMaybe<Scalars['DateTime']['input']>
	readonly invokedByIdentityId?: InputMaybe<Scalars['String']['input']>
	readonly personId?: InputMaybe<Scalars['String']['input']>
	readonly personInputIdentifier?: InputMaybe<Scalars['String']['input']>
	readonly success?: InputMaybe<Scalars['Boolean']['input']>
	readonly targetPersonId?: InputMaybe<Scalars['String']['input']>
	/** OR-combined: any of the listed `auth_log_type` values matches. */
	readonly types?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
}

export type AuthLogPage = {
	readonly __typename?: 'AuthLogPage'
	readonly entries: ReadonlyArray<AuthLogEntry>
	/** True when more rows exist past `offset + limit`. */
	readonly hasMore: Scalars['Boolean']['output']
}

export type AuthPolicy = {
	readonly __typename?: 'AuthPolicy'
	readonly id: Scalars['String']['output']
	readonly idleTimeout?: Maybe<Scalars['Interval']['output']>
	readonly mfaGraceDuration?: Maybe<Scalars['Interval']['output']>
	readonly mfaRequired?: Maybe<Scalars['Boolean']['output']>
	/** Project slug, present only for project-scoped policies. */
	readonly project?: Maybe<Scalars['String']['output']>
	readonly rememberMeAllowed?: Maybe<Scalars['Boolean']['output']>
	readonly roles: ReadonlyArray<Scalars['String']['output']>
	readonly scope: AuthPolicyScope
	readonly tokenExpiration?: Maybe<Scalars['Interval']['output']>
}

export type AuthPolicyInput = {
	readonly idleTimeout?: InputMaybe<Scalars['Interval']['input']>
	readonly mfaGraceDuration?: InputMaybe<Scalars['Interval']['input']>
	readonly mfaRequired?: InputMaybe<Scalars['Boolean']['input']>
	/** Project slug. Required for scope=project, forbidden for scope=global. */
	readonly project?: InputMaybe<Scalars['String']['input']>
	readonly rememberMeAllowed?: InputMaybe<Scalars['Boolean']['input']>
	readonly roles: ReadonlyArray<Scalars['String']['input']>
	readonly scope: AuthPolicyScope
	readonly tokenExpiration?: InputMaybe<Scalars['Interval']['input']>
}

export type AuthPolicyScope =
	| 'global'
	| 'project'

export type CaptchaProvider =
	| 'hcaptcha'
	| 'recaptchaV3'
	| 'turnstile'

export type ChangeMyPasswordError = {
	readonly __typename?: 'ChangeMyPasswordError'
	readonly code: ChangeMyPasswordErrorCode
	readonly developerMessage: Scalars['String']['output']
	readonly weakPasswordReasons?: Maybe<ReadonlyArray<WeakPasswordReason>>
}

export type ChangeMyPasswordErrorCode =
	| 'INVALID_PASSWORD'
	| 'NOT_A_PERSON'
	| 'NO_PASSWORD_SET'
	| 'TOO_WEAK'

export type ChangeMyPasswordResponse = {
	readonly __typename?: 'ChangeMyPasswordResponse'
	readonly error?: Maybe<ChangeMyPasswordError>
	readonly ok: Scalars['Boolean']['output']
}

export type ChangeMyProfileError = {
	readonly __typename?: 'ChangeMyProfileError'
	readonly code: ChangeMyProfileErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ChangeMyProfileErrorCode =
	| 'EMAIL_ALREADY_EXISTS'
	| 'INVALID_EMAIL_FORMAT'
	| 'NOT_A_PERSON'
	| 'RATE_LIMIT_EXCEEDED'

export type ChangeMyProfileResponse = {
	readonly __typename?: 'ChangeMyProfileResponse'
	readonly error?: Maybe<ChangeMyProfileError>
	readonly ok: Scalars['Boolean']['output']
}

export type ChangePasswordError = {
	readonly __typename?: 'ChangePasswordError'
	readonly code: ChangePasswordErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
	readonly weakPasswordReasons?: Maybe<ReadonlyArray<WeakPasswordReason>>
}

export type ChangePasswordErrorCode =
	| 'PERSON_NOT_FOUND'
	| 'TOO_WEAK'

export type ChangePasswordResponse = {
	readonly __typename?: 'ChangePasswordResponse'
	readonly error?: Maybe<ChangePasswordError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<ChangePasswordError>
	readonly ok: Scalars['Boolean']['output']
}

export type ChangeProfileError = {
	readonly __typename?: 'ChangeProfileError'
	readonly code: ChangeProfileErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ChangeProfileErrorCode =
	| 'EMAIL_ALREADY_EXISTS'
	| 'INVALID_EMAIL_FORMAT'
	| 'PERSON_NOT_FOUND'

export type ChangeProfileResponse = {
	readonly __typename?: 'ChangeProfileResponse'
	readonly error?: Maybe<ChangeProfileError>
	readonly ok: Scalars['Boolean']['output']
}

export type CheckResetPasswordTokenCode =
	| 'REQUEST_NOT_FOUND'
	| 'TOKEN_EXPIRED'
	| 'TOKEN_INVALID'
	| 'TOKEN_NOT_FOUND'
	| 'TOKEN_USED'

export type CheckResetPasswordTokenResult = {
	readonly __typename?: 'CheckResetPasswordTokenResult'
	readonly code: CheckResetPasswordTokenCode
}

export type CommonSignInResult = {
	readonly person: Person
	readonly token: Scalars['String']['output']
}

export type Config = {
	readonly __typename?: 'Config'
	readonly captcha: ConfigCaptcha
	readonly emailChange: ConfigEmailChange
	readonly login: ConfigLogin
	readonly password: ConfigPassword
	readonly passwordless: ConfigPasswordless
	readonly rateLimits: ConfigRateLimits
	readonly signup: ConfigSignup
}

/**
 * Captcha config. The secret is never exposed; only the provider and (where
 * applicable) the threshold are readable.
 */
export type ConfigCaptcha = {
	readonly __typename?: 'ConfigCaptcha'
	readonly protect: ConfigCaptchaProtect
	readonly provider?: Maybe<CaptchaProvider>
	readonly threshold?: Maybe<Scalars['Float']['output']>
}

/**
 * Provider null disables captcha verification. Secret is write-only.
 * Pass null secret to leave the stored value unchanged; pass empty string to clear.
 */
export type ConfigCaptchaInput = {
	readonly protect?: InputMaybe<ConfigCaptchaProtectInput>
	readonly provider?: InputMaybe<CaptchaProvider>
	readonly secret?: InputMaybe<Scalars['String']['input']>
	readonly threshold?: InputMaybe<Scalars['Float']['input']>
}

/**
 * Per-flow captcha enforcement. The captcha provider/secret is shared; these
 * flags decide which mutations actually require a captcha token when a provider
 * is configured.
 */
export type ConfigCaptchaProtect = {
	readonly __typename?: 'ConfigCaptchaProtect'
	readonly emailVerification: Scalars['Boolean']['output']
	readonly passwordReset: Scalars['Boolean']['output']
	readonly passwordlessInit: Scalars['Boolean']['output']
	readonly signUp: Scalars['Boolean']['output']
}

export type ConfigCaptchaProtectInput = {
	readonly emailVerification?: InputMaybe<Scalars['Boolean']['input']>
	readonly passwordReset?: InputMaybe<Scalars['Boolean']['input']>
	readonly passwordlessInit?: InputMaybe<Scalars['Boolean']['input']>
	readonly signUp?: InputMaybe<Scalars['Boolean']['input']>
}

export type ConfigEmailChange = {
	readonly __typename?: 'ConfigEmailChange'
	/**
	 * When true, a user-initiated changeMyProfile e-mail change does not swap
	 * the address immediately: it goes through a confirmation flow
	 * (confirmEmailChange) against a token mailed to the new address, and the
	 * old address stays active until the new one is confirmed. Independent of
	 * ConfigSignup.requireEmailVerification. Defaults to false.
	 */
	readonly requireVerification: Scalars['Boolean']['output']
}

export type ConfigEmailChangeInput = {
	readonly requireVerification?: InputMaybe<Scalars['Boolean']['input']>
}

export type ConfigInput = {
	readonly captcha?: InputMaybe<ConfigCaptchaInput>
	readonly emailChange?: InputMaybe<ConfigEmailChangeInput>
	readonly login?: InputMaybe<ConfigLoginInput>
	readonly password?: InputMaybe<ConfigPasswordInput>
	readonly passwordless?: InputMaybe<ConfigPasswordlessInput>
	readonly rateLimits?: InputMaybe<ConfigRateLimitsInput>
	readonly signup?: InputMaybe<ConfigSignupInput>
}

export type ConfigLogin = {
	readonly __typename?: 'ConfigLogin'
	readonly anomalyDetection: ConfigLoginAnomalyDetection
	readonly attemptWindow: Scalars['Interval']['output']
	readonly baseBackoff: Scalars['Interval']['output']
	readonly defaultTokenExpiration: Scalars['Interval']['output']
	readonly maxBackoff: Scalars['Interval']['output']
	readonly maxTokenExpiration?: Maybe<Scalars['Interval']['output']>
	readonly mfaGraceDuration: Scalars['Interval']['output']
	/**
	 * If false, signIn collapses NO_PASSWORD_SET / INVALID_PASSWORD into a
	 * generic INVALID_CREDENTIALS and signUp omits the recommendedAction
	 * hint on EMAIL_ALREADY_EXISTS errors. UNKNOWN_EMAIL and existence-level
	 * signals are still controlled by revealUserExists. Defaults to true
	 * (no change vs. previous behavior).
	 */
	readonly revealLoginMethod: Scalars['Boolean']['output']
	readonly revealUserExists: Scalars['Boolean']['output']
}

/**
 * Sign-in anomaly detection (A03). Opt-in, disabled by default. When enabled,
 * each successful password verification is scored against the person's last
 * historySize successful logins using signals derived from the trusted client
 * info (country from a reverse-proxy geo header, a user-agent fingerprint, and
 * the IP / IP prefix). The cumulative score then drives an action:
 *   - score >= emailThreshold  → an informational UNUSUAL_LOGIN email is sent.
 *   - score >= stepUpThreshold → a second factor (email OTP) is additionally
 *     required before a session is issued (reuses the existing step-up flow).
 * Country is only ever read through the same trusted-proxy gate as the
 * forwarded IP / User-Agent — never from an untrusted client.
 */
export type ConfigLoginAnomalyDetection = {
	readonly __typename?: 'ConfigLoginAnomalyDetection'
	readonly emailThreshold: Scalars['Int']['output']
	readonly enabled: Scalars['Boolean']['output']
	readonly historySize: Scalars['Int']['output']
	readonly stepUpThreshold: Scalars['Int']['output']
}

export type ConfigLoginAnomalyDetectionInput = {
	readonly emailThreshold?: InputMaybe<Scalars['Int']['input']>
	readonly enabled?: InputMaybe<Scalars['Boolean']['input']>
	readonly historySize?: InputMaybe<Scalars['Int']['input']>
	readonly stepUpThreshold?: InputMaybe<Scalars['Int']['input']>
}

export type ConfigLoginInput = {
	readonly anomalyDetection?: InputMaybe<ConfigLoginAnomalyDetectionInput>
	readonly attemptWindow?: InputMaybe<Scalars['Interval']['input']>
	readonly baseBackoff?: InputMaybe<Scalars['Interval']['input']>
	readonly defaultTokenExpiration?: InputMaybe<Scalars['Interval']['input']>
	readonly maxBackoff?: InputMaybe<Scalars['Interval']['input']>
	readonly maxTokenExpiration?: InputMaybe<Scalars['Interval']['input']>
	readonly mfaGraceDuration?: InputMaybe<Scalars['Interval']['input']>
	readonly revealLoginMethod?: InputMaybe<Scalars['Boolean']['input']>
	readonly revealUserExists?: InputMaybe<Scalars['Boolean']['input']>
}

export type ConfigPassword = {
	readonly __typename?: 'ConfigPassword'
	readonly checkBlacklist: Scalars['Boolean']['output']
	readonly checkHibp: Scalars['Boolean']['output']
	readonly minLength: Scalars['Int']['output']
	readonly pattern?: Maybe<Scalars['String']['output']>
	readonly requireDigit: Scalars['Int']['output']
	readonly requireLowercase: Scalars['Int']['output']
	readonly requireSpecial: Scalars['Int']['output']
	readonly requireUppercase: Scalars['Int']['output']
}

export type ConfigPasswordInput = {
	readonly checkBlacklist?: InputMaybe<Scalars['Boolean']['input']>
	readonly checkHibp?: InputMaybe<Scalars['Boolean']['input']>
	readonly minLength?: InputMaybe<Scalars['Int']['input']>
	readonly pattern?: InputMaybe<Scalars['String']['input']>
	readonly requireDigit?: InputMaybe<Scalars['Int']['input']>
	readonly requireLowercase?: InputMaybe<Scalars['Int']['input']>
	readonly requireSpecial?: InputMaybe<Scalars['Int']['input']>
	readonly requireUppercase?: InputMaybe<Scalars['Int']['input']>
}

export type ConfigPasswordless = {
	readonly __typename?: 'ConfigPasswordless'
	readonly enabled: ConfigPolicy
	readonly expiration: Scalars['Interval']['output']
	readonly url?: Maybe<Scalars['String']['output']>
}

export type ConfigPasswordlessInput = {
	readonly enabled?: InputMaybe<ConfigPolicy>
	readonly expiration?: InputMaybe<Scalars['Interval']['input']>
	readonly url?: InputMaybe<Scalars['String']['input']>
}

export type ConfigPolicy =
	| 'always'
	| 'never'
	| 'optIn'
	| 'optOut'

export type ConfigRateLimitWindow = {
	readonly __typename?: 'ConfigRateLimitWindow'
	readonly limit: Scalars['Int']['output']
	readonly window: Scalars['Interval']['output']
}

export type ConfigRateLimitWindowInput = {
	readonly limit?: InputMaybe<Scalars['Int']['input']>
	readonly window?: InputMaybe<Scalars['Interval']['input']>
}

/**
 * Configurable per-IP rate-limit windows. Each value bounds the number of
 * attempts allowed from the same client IP in the configured window. Per-email
 * throttling for password-reset and passwordless-init flows reuses the
 * exponential backoff from ConfigLogin (baseBackoff / maxBackoff /
 * attemptWindow) against person_auth_log entries.
 */
export type ConfigRateLimits = {
	readonly __typename?: 'ConfigRateLimits'
	/**
	 * Caps how many email-OTP codes may be dispatched per person within the
	 * window (a brute-force / email-bomb backstop). Unlike the per-IP limits it
	 * ships enabled by default. Set limit to 0 to disable.
	 */
	readonly emailOtpPerPerson: ConfigRateLimitWindow
	readonly emailVerificationPerIp: ConfigRateLimitWindow
	readonly loginPerIp: ConfigRateLimitWindow
	readonly passwordResetPerIp: ConfigRateLimitWindow
	readonly passwordlessInitPerIp: ConfigRateLimitWindow
	readonly signUpPerIp: ConfigRateLimitWindow
}

export type ConfigRateLimitsInput = {
	readonly emailOtpPerPerson?: InputMaybe<ConfigRateLimitWindowInput>
	readonly emailVerificationPerIp?: InputMaybe<ConfigRateLimitWindowInput>
	readonly loginPerIp?: InputMaybe<ConfigRateLimitWindowInput>
	readonly passwordResetPerIp?: InputMaybe<ConfigRateLimitWindowInput>
	readonly passwordlessInitPerIp?: InputMaybe<ConfigRateLimitWindowInput>
	readonly signUpPerIp?: InputMaybe<ConfigRateLimitWindowInput>
}

export type ConfigSignup = {
	readonly __typename?: 'ConfigSignup'
	/**
	 * When true, new accounts must verify their e-mail address before they can
	 * sign in. The requirement is captured per account at sign-up, so toggling
	 * this only affects accounts created afterwards. Defaults to false (no
	 * change vs. previous behavior). E-mail changes are governed separately by
	 * ConfigEmailChange.requireVerification.
	 */
	readonly requireEmailVerification: Scalars['Boolean']['output']
}

export type ConfigSignupInput = {
	readonly requireEmailVerification?: InputMaybe<Scalars['Boolean']['input']>
}

export type ConfigureError = {
	readonly __typename?: 'ConfigureError'
	readonly code: ConfigureErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ConfigureErrorCode = 'INVALID_CONFIG'

export type ConfigureResponse = {
	readonly __typename?: 'ConfigureResponse'
	readonly error?: Maybe<ConfigureError>
	readonly ok: Scalars['Boolean']['output']
}

export type ConfirmEmailChangeError = {
	readonly __typename?: 'ConfirmEmailChangeError'
	readonly code: ConfirmEmailChangeErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ConfirmEmailChangeErrorCode =
	| 'EMAIL_ALREADY_EXISTS'
	| 'INVALID_EMAIL_FORMAT'
	| 'TOKEN_EXPIRED'
	| 'TOKEN_INVALID'
	| 'TOKEN_NOT_FOUND'
	| 'TOKEN_USED'

export type ConfirmEmailChangeResponse = {
	readonly __typename?: 'ConfirmEmailChangeResponse'
	readonly error?: Maybe<ConfirmEmailChangeError>
	readonly ok: Scalars['Boolean']['output']
}

export type ConfirmEmailOtpError = {
	readonly __typename?: 'ConfirmEmailOtpError'
	readonly code: ConfirmEmailOtpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ConfirmEmailOtpErrorCode = 'INVALID_OTP_TOKEN'

export type ConfirmEmailOtpResponse = {
	readonly __typename?: 'ConfirmEmailOtpResponse'
	readonly error?: Maybe<ConfirmEmailOtpError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<ConfirmEmailOtpResult>
}

export type ConfirmEmailOtpResult = {
	readonly __typename?: 'ConfirmEmailOtpResult'
	readonly backupCodes: ReadonlyArray<Scalars['String']['output']>
}

export type ConfirmOtpError = {
	readonly __typename?: 'ConfirmOtpError'
	readonly code: ConfirmOtpErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type ConfirmOtpErrorCode =
	| 'INVALID_OTP_TOKEN'
	| 'NOT_PREPARED'

export type ConfirmOtpResponse = {
	readonly __typename?: 'ConfirmOtpResponse'
	readonly error?: Maybe<ConfirmOtpError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<ConfirmOtpError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<ConfirmOtpResult>
}

export type ConfirmOtpResult = {
	readonly __typename?: 'ConfirmOtpResult'
	readonly backupCodes: ReadonlyArray<Scalars['String']['output']>
}

export type CreateApiKeyError = {
	readonly __typename?: 'CreateApiKeyError'
	readonly code: CreateApiKeyErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
	readonly membershipValidation?: Maybe<ReadonlyArray<MembershipValidationError>>
}

export type CreateApiKeyErrorCode =
	| 'INVALID_MEMBERSHIP'
	| 'INVALID_ROLE'
	| 'PROJECT_NOT_FOUND'
	| 'ROLE_NOT_FOUND'
	| 'VARIABLE_EMPTY'
	| 'VARIABLE_NOT_FOUND'

export type CreateApiKeyOptions = {
	/**
	 * If true, the created api_key trusts X-Contember-Client-IP and
	 * X-Contember-Client-User-Agent headers on subsequent requests.
	 * Intended for backend services that proxy user requests; the customer's
	 * proxy must strip these headers from incoming traffic and re-inject
	 * them with the real user values.
	 */
	readonly trustForwardedClientInfo?: InputMaybe<Scalars['Boolean']['input']>
}

export type CreateApiKeyResponse = {
	readonly __typename?: 'CreateApiKeyResponse'
	readonly error?: Maybe<CreateApiKeyError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<CreateApiKeyError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<CreateApiKeyResult>
}

export type CreateApiKeyResult = {
	readonly __typename?: 'CreateApiKeyResult'
	readonly apiKey: ApiKeyWithToken
}

export type CreateAuthPolicyError = {
	readonly __typename?: 'CreateAuthPolicyError'
	readonly code: CreateAuthPolicyErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type CreateAuthPolicyErrorCode =
	| 'PROJECT_NOT_ALLOWED'
	| 'PROJECT_NOT_FOUND'
	| 'PROJECT_REQUIRED'

export type CreateAuthPolicyResponse = {
	readonly __typename?: 'CreateAuthPolicyResponse'
	readonly error?: Maybe<CreateAuthPolicyError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<CreateAuthPolicyResult>
}

export type CreateAuthPolicyResult = {
	readonly __typename?: 'CreateAuthPolicyResult'
	readonly id: Scalars['String']['output']
}

export type CreateCustomRoleError = {
	readonly __typename?: 'CreateCustomRoleError'
	readonly code: CreateCustomRoleErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type CreateCustomRoleErrorCode =
	| 'DUPLICATE_PERMISSION'
	| 'INVALID_PERMISSION_CONFIGURATION'
	| 'INVALID_SLUG'
	| 'SLUG_ALREADY_EXISTS'
	| 'UNKNOWN_PERMISSION'

export type CreateCustomRoleResponse = {
	readonly __typename?: 'CreateCustomRoleResponse'
	readonly error?: Maybe<CreateCustomRoleError>
	readonly ok: Scalars['Boolean']['output']
}

export type CreatePasswordResetRequestError = {
	readonly __typename?: 'CreatePasswordResetRequestError'
	readonly code: CreatePasswordResetRequestErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type CreatePasswordResetRequestErrorCode =
	| 'INVALID_CAPTCHA'
	| 'PERSON_NOT_FOUND'
	| 'RATE_LIMIT_EXCEEDED'

export type CreatePasswordResetRequestResponse = {
	readonly __typename?: 'CreatePasswordResetRequestResponse'
	readonly error?: Maybe<CreatePasswordResetRequestError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<CreatePasswordResetRequestError>
	readonly ok: Scalars['Boolean']['output']
}

export type CreateProjectOptions = {
	readonly deployTokenHash?: InputMaybe<Scalars['String']['input']>
	readonly noDeployToken?: InputMaybe<Scalars['Boolean']['input']>
}

export type CreateProjectResponse = {
	readonly __typename?: 'CreateProjectResponse'
	readonly error?: Maybe<CreateProjectResponseError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<CreateProjectResult>
}

export type CreateProjectResponseError = {
	readonly __typename?: 'CreateProjectResponseError'
	readonly code: CreateProjectResponseErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type CreateProjectResponseErrorCode =
	| 'ALREADY_EXISTS'
	| 'INIT_ERROR'

export type CreateProjectResult = {
	readonly __typename?: 'CreateProjectResult'
	readonly deployerApiKey?: Maybe<ApiKeyWithToken>
}

export type CreateResetPasswordRequestOptions = {
	readonly mailProject?: InputMaybe<Scalars['String']['input']>
	readonly mailVariant?: InputMaybe<Scalars['String']['input']>
}

export type CreateSessionTokenError = {
	readonly __typename?: 'CreateSessionTokenError'
	readonly code: CreateSessionTokenErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type CreateSessionTokenErrorCode =
	| 'PERSON_DISABLED'
	| 'UNKNOWN_EMAIL'
	| 'UNKNOWN_PERSON_ID'

export type CreateSessionTokenResponse = {
	readonly __typename?: 'CreateSessionTokenResponse'
	readonly error?: Maybe<CreateSessionTokenError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<CreateSessionTokenResult>
}

export type CreateSessionTokenResult = CommonSignInResult & {
	readonly __typename?: 'CreateSessionTokenResult'
	readonly person: Person
	readonly token: Scalars['String']['output']
}

export type CustomRole = {
	readonly __typename?: 'CustomRole'
	readonly description?: Maybe<Scalars['String']['output']>
	readonly grants: ReadonlyArray<CustomRoleGrant>
	readonly slug: Scalars['String']['output']
}

export type CustomRoleConfigurationKind =
	| 'CHANGE_PROFILE'
	| 'CREATE_SESSION_TOKEN'
	| 'GLOBAL_API_KEY'
	| 'MAIL_TEMPLATE_SCOPE'
	| 'NONE'
	| 'ROLE_INPUT'
	| 'ROLE_MUTATION'
	| 'TARGET_IDENTITY'

export type CustomRoleGrant = {
	readonly __typename?: 'CustomRoleGrant'
	readonly config?: Maybe<Scalars['Json']['output']>
	readonly permission: Scalars['String']['output']
}

export type CustomRoleGrantInput = {
	readonly config?: InputMaybe<Scalars['Json']['input']>
	readonly permission: Scalars['String']['input']
}

export type CustomRolePermissionDefinition = {
	readonly __typename?: 'CustomRolePermissionDefinition'
	readonly configurationKind: CustomRoleConfigurationKind
	readonly configurationRequired: Scalars['Boolean']['output']
	readonly defaultConfig?: Maybe<Scalars['Json']['output']>
	readonly name: Scalars['String']['output']
}

export type DeleteAuthPolicyError = {
	readonly __typename?: 'DeleteAuthPolicyError'
	readonly code: DeleteAuthPolicyErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type DeleteAuthPolicyErrorCode = 'NOT_FOUND'

export type DeleteAuthPolicyResponse = {
	readonly __typename?: 'DeleteAuthPolicyResponse'
	readonly error?: Maybe<DeleteAuthPolicyError>
	readonly ok: Scalars['Boolean']['output']
}

export type DeleteCustomRoleError = {
	readonly __typename?: 'DeleteCustomRoleError'
	readonly code: DeleteCustomRoleErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type DeleteCustomRoleErrorCode = 'NOT_FOUND'

export type DeleteCustomRoleResponse = {
	readonly __typename?: 'DeleteCustomRoleResponse'
	readonly error?: Maybe<DeleteCustomRoleError>
	readonly ok: Scalars['Boolean']['output']
}

export type DisableApiKeyError = {
	readonly __typename?: 'DisableApiKeyError'
	readonly code: DisableApiKeyErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type DisableApiKeyErrorCode = 'KEY_NOT_FOUND'

export type DisableApiKeyResponse = {
	readonly __typename?: 'DisableApiKeyResponse'
	readonly error?: Maybe<DisableApiKeyError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<DisableApiKeyError>
	readonly ok: Scalars['Boolean']['output']
}

export type DisableEmailOtpError = {
	readonly __typename?: 'DisableEmailOtpError'
	readonly code: DisableEmailOtpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type DisableEmailOtpErrorCode =
	| 'EMAIL_OTP_NOT_ACTIVE'
	| 'MFA_REQUIRED'

export type DisableEmailOtpResponse = {
	readonly __typename?: 'DisableEmailOtpResponse'
	readonly error?: Maybe<DisableEmailOtpError>
	readonly ok: Scalars['Boolean']['output']
}

export type DisableIdpError = {
	readonly __typename?: 'DisableIDPError'
	readonly code: DisableIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type DisableIdpErrorCode = 'NOT_FOUND'

export type DisableIdpResponse = {
	readonly __typename?: 'DisableIDPResponse'
	readonly error?: Maybe<DisableIdpError>
	readonly ok: Scalars['Boolean']['output']
}

export type DisableOtpError = {
	readonly __typename?: 'DisableOtpError'
	readonly code: DisableOtpErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type DisableOtpErrorCode =
	| 'MFA_REQUIRED'
	| 'OTP_NOT_ACTIVE'

export type DisableOtpResponse = {
	readonly __typename?: 'DisableOtpResponse'
	readonly error?: Maybe<DisableOtpError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<DisableOtpError>
	readonly ok: Scalars['Boolean']['output']
}

export type DisablePersonError = {
	readonly __typename?: 'DisablePersonError'
	readonly code: DisablePersonErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type DisablePersonErrorCode =
	| 'PERSON_ALREADY_DISABLED'
	| 'PERSON_NOT_FOUND'

export type DisablePersonResponse = {
	readonly __typename?: 'DisablePersonResponse'
	readonly error?: Maybe<DisablePersonError>
	readonly ok: Scalars['Boolean']['output']
}

export type DisconnectIdpError = {
	readonly __typename?: 'DisconnectIDPError'
	readonly code: DisconnectIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type DisconnectIdpErrorCode =
	/**  The person is not allowed to disconnect their last remaining sign-in method.  */
	| 'LAST_AUTH_METHOD'
	/**  The caller is not a person (e.g. an API key) and so has no IdP connections to disconnect.  */
	| 'NOT_A_PERSON'
	/**  The authenticated person has no IdP connection with the given id.  */
	| 'NOT_FOUND'

export type DisconnectIdpResponse = {
	readonly __typename?: 'DisconnectIDPResponse'
	readonly error?: Maybe<DisconnectIdpError>
	readonly ok: Scalars['Boolean']['output']
}

export type EmailVerificationOptions = {
	readonly mailProject?: InputMaybe<Scalars['String']['input']>
	readonly mailVariant?: InputMaybe<Scalars['String']['input']>
}

export type EnableIdpError = {
	readonly __typename?: 'EnableIDPError'
	readonly code: EnableIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type EnableIdpErrorCode = 'NOT_FOUND'

export type EnableIdpResponse = {
	readonly __typename?: 'EnableIDPResponse'
	readonly error?: Maybe<EnableIdpError>
	readonly ok: Scalars['Boolean']['output']
}

export type ForceSignOutPersonError = {
	readonly __typename?: 'ForceSignOutPersonError'
	readonly code: ForceSignOutPersonErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ForceSignOutPersonErrorCode = 'PERSON_NOT_FOUND'

export type ForceSignOutPersonResponse = {
	readonly __typename?: 'ForceSignOutPersonResponse'
	readonly error?: Maybe<ForceSignOutPersonError>
	readonly ok: Scalars['Boolean']['output']
}

export type IdpOptions = {
	readonly assumeEmailVerified?: InputMaybe<Scalars['Boolean']['input']>
	readonly autoSignUp?: InputMaybe<Scalars['Boolean']['input']>
	readonly exclusive?: InputMaybe<Scalars['Boolean']['input']>
	readonly initReturnsConfig?: InputMaybe<Scalars['Boolean']['input']>
	readonly requireVerifiedEmail?: InputMaybe<Scalars['Boolean']['input']>
}

export type IdpOptionsOutput = {
	readonly __typename?: 'IDPOptionsOutput'
	/**
	 * When true, e-mail addresses asserted by this provider are treated as verified
	 * even without an "email_verified" claim. Use only for trusted providers.
	 * Defaults to false.
	 */
	readonly assumeEmailVerified: Scalars['Boolean']['output']
	readonly autoSignUp: Scalars['Boolean']['output']
	readonly exclusive: Scalars['Boolean']['output']
	readonly initReturnsConfig: Scalars['Boolean']['output']
	/**
	 * When true, a non-exclusive provider may only auto-link to / sign in an
	 * existing account by e-mail if the provider asserts the e-mail is verified.
	 * Defaults to false.
	 */
	readonly requireVerifiedEmail: Scalars['Boolean']['output']
}

export type IdpResponseInput = {
	readonly url: Scalars['String']['input']
}

export type Identity = {
	readonly __typename?: 'Identity'
	readonly apiKey?: Maybe<ApiKey>
	readonly description?: Maybe<Scalars['String']['output']>
	readonly id: Scalars['String']['output']
	readonly permissions?: Maybe<IdentityGlobalPermissions>
	readonly person?: Maybe<Person>
	readonly projects: ReadonlyArray<IdentityProjectRelation>
	readonly roles?: Maybe<ReadonlyArray<Scalars['String']['output']>>
	/**
	 * Active SESSION-type api keys for this identity. Always visible for
	 * the calling identity (e.g. via `me { sessions }`). For other identities,
	 * visible to callers holding the `person:viewSessions` permission against
	 * the target's roles — SUPER_ADMIN sees everyone; PROJECT_ADMIN sees
	 * members whose roles fall within their allowed-input-roles. Returns an
	 * empty list rather than throwing when the viewer lacks visibility, so
	 * batched identity queries do not abort on a single forbidden target.
	 */
	readonly sessions: ReadonlyArray<SessionInfo>
}

export type IdentityGlobalPermissions = {
	readonly __typename?: 'IdentityGlobalPermissions'
	readonly canCreateProject: Scalars['Boolean']['output']
	readonly canDeployEntrypoint: Scalars['Boolean']['output']
}

export type IdentityProjectRelation = {
	readonly __typename?: 'IdentityProjectRelation'
	readonly memberships: ReadonlyArray<Membership>
	readonly project: Project
}

export type IdentityProvider = {
	readonly __typename?: 'IdentityProvider'
	readonly configuration: Scalars['Json']['output']
	readonly disabledAt?: Maybe<Scalars['DateTime']['output']>
	readonly options: IdpOptionsOutput
	readonly slug: Scalars['String']['output']
	readonly type: Scalars['String']['output']
}

/**  Public view of an identity provider, exposed in personal IdP connection listings.  */
export type IdentityProviderListItem = {
	readonly __typename?: 'IdentityProviderListItem'
	readonly disabledAt?: Maybe<Scalars['DateTime']['output']>
	readonly slug: Scalars['String']['output']
	readonly type: Scalars['String']['output']
}

export type InitEmailOtpError = {
	readonly __typename?: 'InitEmailOtpError'
	readonly code: InitEmailOtpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type InitEmailOtpErrorCode =
	| 'NO_EMAIL'
	| 'RATE_LIMITED'

export type InitEmailOtpResponse = {
	readonly __typename?: 'InitEmailOtpResponse'
	readonly error?: Maybe<InitEmailOtpError>
	readonly ok: Scalars['Boolean']['output']
}

export type InitSignInIdpError = {
	readonly __typename?: 'InitSignInIDPError'
	readonly code: InitSignInIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type InitSignInIdpErrorCode =
	| 'IDP_VALIDATION_FAILED'
	| 'PROVIDER_NOT_FOUND'

export type InitSignInIdpResponse = {
	readonly __typename?: 'InitSignInIDPResponse'
	readonly error?: Maybe<InitSignInIdpError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<InitSignInIdpError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<InitSignInIdpResult>
}

export type InitSignInIdpResult = {
	readonly __typename?: 'InitSignInIDPResult'
	readonly authUrl: Scalars['String']['output']
	readonly idpConfiguration?: Maybe<Scalars['Json']['output']>
	readonly sessionData: Scalars['Json']['output']
}

export type InitSignInPasswordlessError = {
	readonly __typename?: 'InitSignInPasswordlessError'
	readonly code: InitSignInPasswordlessErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type InitSignInPasswordlessErrorCode =
	| 'INVALID_CAPTCHA'
	| 'PASSWORDLESS_DISABLED'
	| 'PERSON_NOT_FOUND'
	| 'RATE_LIMIT_EXCEEDED'

export type InitSignInPasswordlessOptions = {
	readonly mailProject?: InputMaybe<Scalars['String']['input']>
	readonly mailVariant?: InputMaybe<Scalars['String']['input']>
}

export type InitSignInPasswordlessResponse = {
	readonly __typename?: 'InitSignInPasswordlessResponse'
	readonly error?: Maybe<InitSignInPasswordlessError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<InitSignInPasswordlessResult>
}

export type InitSignInPasswordlessResult = {
	readonly __typename?: 'InitSignInPasswordlessResult'
	readonly expiresAt: Scalars['DateTime']['output']
	readonly requestId: Scalars['String']['output']
}

export type InviteError = {
	readonly __typename?: 'InviteError'
	readonly code: InviteErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
	readonly membershipValidation?: Maybe<ReadonlyArray<MembershipValidationError>>
}

export type InviteErrorCode =
	| 'ALREADY_MEMBER'
	| 'INVALID_EMAIL_FORMAT'
	| 'INVALID_MEMBERSHIP'
	| 'PROJECT_NOT_FOUND'
	| 'ROLE_NOT_FOUND'
	| 'VARIABLE_EMPTY'
	| 'VARIABLE_NOT_FOUND'

export type InviteMethod =
	| 'CREATE_PASSWORD'
	| 'RESET_PASSWORD'

export type InviteOptions = {
	readonly mailVariant?: InputMaybe<Scalars['String']['input']>
	readonly method?: InputMaybe<InviteMethod>
}

export type InviteResponse = {
	readonly __typename?: 'InviteResponse'
	readonly error?: Maybe<InviteError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<InviteError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<InviteResult>
}

export type InviteResult = {
	readonly __typename?: 'InviteResult'
	readonly isNew: Scalars['Boolean']['output']
	readonly person: Person
}

export type MailTemplate = {
	readonly content: Scalars['String']['input']
	readonly projectSlug?: InputMaybe<Scalars['String']['input']>
	readonly replyTo?: InputMaybe<Scalars['String']['input']>
	readonly subject: Scalars['String']['input']
	readonly type: MailType
	readonly useLayout?: InputMaybe<Scalars['Boolean']['input']>
	/** Custom mail variant identifier, e.g. a locale. */
	readonly variant?: InputMaybe<Scalars['String']['input']>
}

export type MailTemplateData = {
	readonly __typename?: 'MailTemplateData'
	readonly content: Scalars['String']['output']
	readonly projectSlug?: Maybe<Scalars['String']['output']>
	readonly replyTo?: Maybe<Scalars['String']['output']>
	readonly subject: Scalars['String']['output']
	readonly type: MailType
	readonly useLayout: Scalars['Boolean']['output']
	readonly variant?: Maybe<Scalars['String']['output']>
}

export type MailTemplateIdentifier = {
	readonly projectSlug?: InputMaybe<Scalars['String']['input']>
	readonly type: MailType
	readonly variant?: InputMaybe<Scalars['String']['input']>
}

export type MailType =
	| 'BACKUP_CODES_EXHAUSTED'
	| 'EMAIL_CHANGE_NOTIFY'
	| 'EMAIL_CHANGE_VERIFY'
	| 'EMAIL_OTP'
	| 'EMAIL_VERIFICATION'
	| 'EXISTING_USER_INVITED'
	| 'FORCED_SIGN_OUT'
	| 'NEW_USER_INVITED'
	| 'PASSWORDLESS_SIGN_IN'
	| 'RESET_PASSWORD_REQUEST'
	| 'UNUSUAL_LOGIN'

export type MemberType =
	| 'API_KEY'
	| 'PERSON'

export type Membership = {
	readonly __typename?: 'Membership'
	readonly role: Scalars['String']['output']
	readonly variables: ReadonlyArray<VariableEntry>
}

export type MembershipInput = {
	readonly role: Scalars['String']['input']
	readonly variables: ReadonlyArray<VariableEntryInput>
}

export type MembershipValidationError = {
	readonly __typename?: 'MembershipValidationError'
	readonly code: MembershipValidationErrorCode
	readonly role: Scalars['String']['output']
	readonly variable?: Maybe<Scalars['String']['output']>
}

export type MembershipValidationErrorCode =
	| 'ROLE_NOT_FOUND'
	| 'VARIABLE_EMPTY'
	| 'VARIABLE_INVALID'
	| 'VARIABLE_NOT_FOUND'

export type MfaEnrollment = {
	readonly __typename?: 'MfaEnrollment'
	readonly otpSecret: Scalars['String']['output']
	readonly otpUri: Scalars['String']['output']
}

export type Mutation = {
	readonly __typename?: 'Mutation'
	readonly activatePasswordlessOtp?: Maybe<ActivatePasswordlessOtpResponse>
	readonly addGlobalIdentityRoles?: Maybe<AddGlobalIdentityRolesResponse>
	readonly addIDP?: Maybe<AddIdpResponse>
	readonly addMailTemplate?: Maybe<AddMailTemplateResponse>
	/** @deprecated use addMailTemplate */
	readonly addProjectMailTemplate?: Maybe<AddMailTemplateResponse>
	readonly addProjectMember?: Maybe<AddProjectMemberResponse>
	readonly changeMyPassword?: Maybe<ChangeMyPasswordResponse>
	readonly changeMyProfile?: Maybe<ChangeMyProfileResponse>
	readonly changePassword?: Maybe<ChangePasswordResponse>
	readonly changeProfile?: Maybe<ChangeProfileResponse>
	readonly configure?: Maybe<ConfigureResponse>
	/**
	 * Confirm a pending e-mail change (see changeMyProfile when
	 * config.signup.requireEmailVerification is enabled). Consumes the token
	 * that was mailed to the new address, swaps the address, and signs out all
	 * existing sessions.
	 */
	readonly confirmEmailChange?: Maybe<ConfirmEmailChangeResponse>
	readonly confirmEmailOtp?: Maybe<ConfirmEmailOtpResponse>
	readonly confirmOtp?: Maybe<ConfirmOtpResponse>
	readonly createApiKey?: Maybe<CreateApiKeyResponse>
	readonly createAuthPolicy?: Maybe<CreateAuthPolicyResponse>
	readonly createCustomRole?: Maybe<CreateCustomRoleResponse>
	readonly createGlobalApiKey?: Maybe<CreateApiKeyResponse>
	readonly createProject?: Maybe<CreateProjectResponse>
	readonly createResetPasswordRequest?: Maybe<CreatePasswordResetRequestResponse>
	readonly createSessionToken?: Maybe<CreateSessionTokenResponse>
	readonly deleteAuthPolicy?: Maybe<DeleteAuthPolicyResponse>
	readonly deleteCustomRole?: Maybe<DeleteCustomRoleResponse>
	readonly disableApiKey?: Maybe<DisableApiKeyResponse>
	readonly disableEmailOtp?: Maybe<DisableEmailOtpResponse>
	readonly disableIDP?: Maybe<DisableIdpResponse>
	readonly disableMyPasswordless?: Maybe<ToggleMyPasswordlessResponse>
	readonly disableOtp?: Maybe<DisableOtpResponse>
	readonly disablePerson?: Maybe<DisablePersonResponse>
	/**
	 * Disconnect one of the authenticated person's own external IdP connections,
	 * addressed by the connection id (see PersonIdentityProvider.id) so a specific
	 * connection can be removed even when the person has several to one provider.
	 */
	readonly disconnectMyIdentityProvider?: Maybe<DisconnectIdpResponse>
	readonly enableIDP?: Maybe<EnableIdpResponse>
	readonly enableMyPasswordless?: Maybe<ToggleMyPasswordlessResponse>
	readonly forceSignOutPerson?: Maybe<ForceSignOutPersonResponse>
	readonly initEmailOtp?: Maybe<InitEmailOtpResponse>
	readonly initSignInIDP?: Maybe<InitSignInIdpResponse>
	readonly initSignInPasswordless?: Maybe<InitSignInPasswordlessResponse>
	readonly invite?: Maybe<InviteResponse>
	readonly prepareOtp?: Maybe<PrepareOtpResponse>
	readonly regenerateBackupCodes?: Maybe<RegenerateBackupCodesResponse>
	readonly removeGlobalIdentityRoles?: Maybe<RemoveGlobalIdentityRolesResponse>
	readonly removeMailTemplate?: Maybe<RemoveMailTemplateResponse>
	/** @deprecated use removeMailTemplate */
	readonly removeProjectMailTemplate?: Maybe<RemoveMailTemplateResponse>
	readonly removeProjectMember?: Maybe<RemoveProjectMemberResponse>
	/**
	 * (Re)send the e-mail verification link for the given address. Always
	 * reports ok regardless of whether the address exists or is already
	 * verified, to avoid leaking account existence.
	 */
	readonly requestEmailVerification?: Maybe<RequestEmailVerificationResponse>
	readonly resetPassword?: Maybe<ResetPasswordResponse>
	readonly resetPersonMfa?: Maybe<ResetPersonMfaResponse>
	readonly revokeSession?: Maybe<RevokeSessionResponse>
	readonly setProjectSecret?: Maybe<SetProjectSecretResponse>
	readonly signIn?: Maybe<SignInResponse>
	readonly signInIDP?: Maybe<SignInIdpResponse>
	readonly signInPasswordless?: Maybe<SignInPasswordlessResponse>
	readonly signOut?: Maybe<SignOutResponse>
	readonly signUp?: Maybe<SignUpResponse>
	readonly unmanagedInvite?: Maybe<InviteResponse>
	readonly updateAuthPolicy?: Maybe<UpdateAuthPolicyResponse>
	readonly updateCustomRole?: Maybe<UpdateCustomRoleResponse>
	readonly updateIDP?: Maybe<UpdateIdpResponse>
	readonly updateProject?: Maybe<UpdateProjectResponse>
	readonly updateProjectMember?: Maybe<UpdateProjectMemberResponse>
	readonly verifyEmail?: Maybe<VerifyEmailResponse>
}

export type MutationActivatePasswordlessOtpArgs = {
	otpHash: Scalars['String']['input']
	requestId: Scalars['String']['input']
	token: Scalars['String']['input']
}

export type MutationAddGlobalIdentityRolesArgs = {
	identityId: Scalars['String']['input']
	roles: ReadonlyArray<Scalars['String']['input']>
}

export type MutationAddIdpArgs = {
	configuration: Scalars['Json']['input']
	identityProvider: Scalars['String']['input']
	options?: InputMaybe<IdpOptions>
	type: Scalars['String']['input']
}

export type MutationAddMailTemplateArgs = {
	template: MailTemplate
}

export type MutationAddProjectMailTemplateArgs = {
	template: MailTemplate
}

export type MutationAddProjectMemberArgs = {
	identityId: Scalars['String']['input']
	memberships: ReadonlyArray<MembershipInput>
	projectSlug: Scalars['String']['input']
}

export type MutationChangeMyPasswordArgs = {
	currentPassword: Scalars['String']['input']
	newPassword: Scalars['String']['input']
}

export type MutationChangeMyProfileArgs = {
	email?: InputMaybe<Scalars['String']['input']>
	name?: InputMaybe<Scalars['String']['input']>
}

export type MutationChangePasswordArgs = {
	password: Scalars['String']['input']
	personId: Scalars['String']['input']
}

export type MutationChangeProfileArgs = {
	email?: InputMaybe<Scalars['String']['input']>
	name?: InputMaybe<Scalars['String']['input']>
	personId: Scalars['String']['input']
}

export type MutationConfigureArgs = {
	config: ConfigInput
}

export type MutationConfirmEmailChangeArgs = {
	token: Scalars['String']['input']
}

export type MutationConfirmEmailOtpArgs = {
	otpToken: Scalars['String']['input']
}

export type MutationConfirmOtpArgs = {
	otpToken: Scalars['String']['input']
}

export type MutationCreateApiKeyArgs = {
	description: Scalars['String']['input']
	memberships: ReadonlyArray<MembershipInput>
	options?: InputMaybe<CreateApiKeyOptions>
	projectSlug: Scalars['String']['input']
	tokenHash?: InputMaybe<Scalars['String']['input']>
}

export type MutationCreateAuthPolicyArgs = {
	policy: AuthPolicyInput
}

export type MutationCreateCustomRoleArgs = {
	description?: InputMaybe<Scalars['String']['input']>
	grants: ReadonlyArray<CustomRoleGrantInput>
	slug: Scalars['String']['input']
}

export type MutationCreateGlobalApiKeyArgs = {
	description: Scalars['String']['input']
	options?: InputMaybe<CreateApiKeyOptions>
	roles?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
	tokenHash?: InputMaybe<Scalars['String']['input']>
}

export type MutationCreateProjectArgs = {
	config?: InputMaybe<Scalars['Json']['input']>
	deployTokenHash?: InputMaybe<Scalars['String']['input']>
	name?: InputMaybe<Scalars['String']['input']>
	options?: InputMaybe<CreateProjectOptions>
	projectSlug: Scalars['String']['input']
	secrets?: InputMaybe<ReadonlyArray<ProjectSecret>>
}

export type MutationCreateResetPasswordRequestArgs = {
	captchaToken?: InputMaybe<Scalars['String']['input']>
	email: Scalars['String']['input']
	options?: InputMaybe<CreateResetPasswordRequestOptions>
}

export type MutationCreateSessionTokenArgs = {
	email?: InputMaybe<Scalars['String']['input']>
	expiration?: InputMaybe<Scalars['Int']['input']>
	options?: InputMaybe<SignInOptions>
	personId?: InputMaybe<Scalars['String']['input']>
}

export type MutationDeleteAuthPolicyArgs = {
	id: Scalars['String']['input']
}

export type MutationDeleteCustomRoleArgs = {
	slug: Scalars['String']['input']
}

export type MutationDisableApiKeyArgs = {
	id: Scalars['String']['input']
}

export type MutationDisableIdpArgs = {
	identityProvider: Scalars['String']['input']
}

export type MutationDisablePersonArgs = {
	personId: Scalars['String']['input']
}

export type MutationDisconnectMyIdentityProviderArgs = {
	id: Scalars['String']['input']
}

export type MutationEnableIdpArgs = {
	identityProvider: Scalars['String']['input']
}

export type MutationForceSignOutPersonArgs = {
	personId: Scalars['String']['input']
	reason?: InputMaybe<Scalars['String']['input']>
}

export type MutationInitSignInIdpArgs = {
	data?: InputMaybe<Scalars['Json']['input']>
	identityProvider: Scalars['String']['input']
	redirectUrl?: InputMaybe<Scalars['String']['input']>
}

export type MutationInitSignInPasswordlessArgs = {
	captchaToken?: InputMaybe<Scalars['String']['input']>
	email: Scalars['String']['input']
	options?: InputMaybe<InitSignInPasswordlessOptions>
}

export type MutationInviteArgs = {
	email: Scalars['String']['input']
	memberships: ReadonlyArray<MembershipInput>
	name?: InputMaybe<Scalars['String']['input']>
	options?: InputMaybe<InviteOptions>
	projectSlug: Scalars['String']['input']
}

export type MutationPrepareOtpArgs = {
	label?: InputMaybe<Scalars['String']['input']>
}

export type MutationRemoveGlobalIdentityRolesArgs = {
	identityId: Scalars['String']['input']
	roles: ReadonlyArray<Scalars['String']['input']>
}

export type MutationRemoveMailTemplateArgs = {
	templateIdentifier: MailTemplateIdentifier
}

export type MutationRemoveProjectMailTemplateArgs = {
	templateIdentifier: MailTemplateIdentifier
}

export type MutationRemoveProjectMemberArgs = {
	identityId: Scalars['String']['input']
	projectSlug: Scalars['String']['input']
}

export type MutationRequestEmailVerificationArgs = {
	captchaToken?: InputMaybe<Scalars['String']['input']>
	email: Scalars['String']['input']
	options?: InputMaybe<EmailVerificationOptions>
}

export type MutationResetPasswordArgs = {
	password: Scalars['String']['input']
	token: Scalars['String']['input']
}

export type MutationResetPersonMfaArgs = {
	personId: Scalars['String']['input']
}

export type MutationRevokeSessionArgs = {
	sessionId: Scalars['String']['input']
}

export type MutationSetProjectSecretArgs = {
	key: Scalars['String']['input']
	projectSlug: Scalars['String']['input']
	value: Scalars['String']['input']
}

export type MutationSignInArgs = {
	backupCode?: InputMaybe<Scalars['String']['input']>
	email: Scalars['String']['input']
	expiration?: InputMaybe<Scalars['Int']['input']>
	options?: InputMaybe<SignInOptions>
	otpToken?: InputMaybe<Scalars['String']['input']>
	password: Scalars['String']['input']
}

export type MutationSignInIdpArgs = {
	data?: InputMaybe<Scalars['Json']['input']>
	expiration?: InputMaybe<Scalars['Int']['input']>
	identityProvider: Scalars['String']['input']
	idpResponse?: InputMaybe<IdpResponseInput>
	options?: InputMaybe<SignInOptions>
	redirectUrl?: InputMaybe<Scalars['String']['input']>
	sessionData?: InputMaybe<Scalars['Json']['input']>
}

export type MutationSignInPasswordlessArgs = {
	backupCode?: InputMaybe<Scalars['String']['input']>
	expiration?: InputMaybe<Scalars['Int']['input']>
	mfaOtp?: InputMaybe<Scalars['String']['input']>
	options?: InputMaybe<SignInOptions>
	requestId: Scalars['String']['input']
	token: Scalars['String']['input']
	validationType: PasswordlessValidationType
}

export type MutationSignOutArgs = {
	all?: InputMaybe<Scalars['Boolean']['input']>
}

export type MutationSignUpArgs = {
	captchaToken?: InputMaybe<Scalars['String']['input']>
	email: Scalars['String']['input']
	name?: InputMaybe<Scalars['String']['input']>
	password?: InputMaybe<Scalars['String']['input']>
	passwordHash?: InputMaybe<Scalars['String']['input']>
	roles?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
}

export type MutationUnmanagedInviteArgs = {
	email: Scalars['String']['input']
	memberships: ReadonlyArray<MembershipInput>
	name?: InputMaybe<Scalars['String']['input']>
	options?: InputMaybe<UnmanagedInviteOptions>
	password?: InputMaybe<Scalars['String']['input']>
	projectSlug: Scalars['String']['input']
}

export type MutationUpdateAuthPolicyArgs = {
	id: Scalars['String']['input']
	policy: AuthPolicyInput
}

export type MutationUpdateCustomRoleArgs = {
	description?: InputMaybe<Scalars['String']['input']>
	grants?: InputMaybe<ReadonlyArray<CustomRoleGrantInput>>
	slug: Scalars['String']['input']
}

export type MutationUpdateIdpArgs = {
	configuration?: InputMaybe<Scalars['Json']['input']>
	identityProvider: Scalars['String']['input']
	mergeConfiguration?: InputMaybe<Scalars['Boolean']['input']>
	options?: InputMaybe<IdpOptions>
	type?: InputMaybe<Scalars['String']['input']>
}

export type MutationUpdateProjectArgs = {
	config?: InputMaybe<Scalars['Json']['input']>
	mergeConfig?: InputMaybe<Scalars['Boolean']['input']>
	name?: InputMaybe<Scalars['String']['input']>
	projectSlug: Scalars['String']['input']
}

export type MutationUpdateProjectMemberArgs = {
	identityId: Scalars['String']['input']
	memberships: ReadonlyArray<MembershipInput>
	projectSlug: Scalars['String']['input']
}

export type MutationVerifyEmailArgs = {
	token: Scalars['String']['input']
}

export type PasswordlessValidationType =
	| 'otp'
	| 'token'

export type Person = {
	readonly __typename?: 'Person'
	readonly email?: Maybe<Scalars['String']['output']>
	/**
	 * Whether e-mail based one-time-password 2FA is enabled for this person
	 * (see `initEmailOtp` / `confirmEmailOtp` / `disableEmailOtp`). Independent
	 * of `otpEnabled` (TOTP authenticator), so a UI can show each MFA method's
	 * state separately.
	 */
	readonly emailOtpEnabled: Scalars['Boolean']['output']
	readonly emailVerified: Scalars['Boolean']['output']
	readonly id: Scalars['String']['output']
	readonly identity: Identity
	/**
	 * External IdP connections of this person. Always visible for the calling
	 * person (e.g. via `me { person { identityProviders } }`). For other
	 * persons, visible to callers holding the `person:viewIdp` permission
	 * against the target's roles — SUPER_ADMIN sees everyone; PROJECT_ADMIN
	 * sees members whose roles fall within their allowed-input-roles. Returns
	 * an empty list rather than throwing when the viewer lacks visibility.
	 */
	readonly identityProviders: ReadonlyArray<PersonIdentityProvider>
	readonly name?: Maybe<Scalars['String']['output']>
	readonly otpEnabled: Scalars['Boolean']['output']
	readonly passwordlessEnabled?: Maybe<Scalars['Boolean']['output']>
}

/**  A single external IdP connection of the currently authenticated person.  */
export type PersonIdentityProvider = {
	readonly __typename?: 'PersonIdentityProvider'
	readonly createdAt: Scalars['DateTime']['output']
	readonly externalIdentifier: Scalars['String']['output']
	readonly id: Scalars['String']['output']
	readonly identityProvider: IdentityProviderListItem
}

/**  Filter for the `persons` query. Fields are combined with AND.  */
export type PersonsFilter = {
	readonly email?: InputMaybe<Scalars['String']['input']>
	readonly identityId?: InputMaybe<Scalars['String']['input']>
	readonly personId?: InputMaybe<Scalars['String']['input']>
}

export type PrepareOtpResponse = {
	readonly __typename?: 'PrepareOtpResponse'
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<PrepareOtpResult>
}

export type PrepareOtpResult = {
	readonly __typename?: 'PrepareOtpResult'
	readonly otpSecret: Scalars['String']['output']
	readonly otpUri: Scalars['String']['output']
}

export type Project = {
	readonly __typename?: 'Project'
	/**
	 * Permanent API keys scoped to this project — keys whose identity is a member
	 * of the project (excludes SESSION tokens and global keys). Each key's
	 * project memberships are reachable via `apiKey.identity.projects` for
	 * cloning when (re)issuing a key. Requires `project.view members` permission;
	 * returns an empty list otherwise.
	 */
	readonly apiKeys: ReadonlyArray<ApiKey>
	readonly config: Scalars['Json']['output']
	readonly id: Scalars['String']['output']
	readonly members: ReadonlyArray<ProjectIdentityRelation>
	readonly name: Scalars['String']['output']
	readonly roles: ReadonlyArray<RoleDefinition>
	/**
	 * Names of the project's secrets (see `setProjectSecret`). Secret VALUES are
	 * never returned — only the keys and their timestamps — so a UI can show which
	 * secrets exist. Requires the `project:viewSecrets` permission (project admins
	 * + SUPER_ADMIN by default); returns an empty list otherwise.
	 */
	readonly secrets: ReadonlyArray<ProjectSecretInfo>
	readonly slug: Scalars['String']['output']
}

export type ProjectMembersArgs = {
	input?: InputMaybe<ProjectMembersInput>
	memberType?: InputMaybe<MemberType>
}

export type ProjectIdentityRelation = {
	readonly __typename?: 'ProjectIdentityRelation'
	readonly identity: Identity
	readonly memberships: ReadonlyArray<Membership>
}

export type ProjectMembersFilter = {
	readonly email?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
	readonly identityId?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
	readonly memberType?: InputMaybe<MemberType>
	readonly personId?: InputMaybe<ReadonlyArray<Scalars['String']['input']>>
}

export type ProjectMembersInput = {
	readonly filter?: InputMaybe<ProjectMembersFilter>
	readonly limit?: InputMaybe<Scalars['Int']['input']>
	readonly offset?: InputMaybe<Scalars['Int']['input']>
}

export type ProjectSecret = {
	readonly key: Scalars['String']['input']
	readonly value: Scalars['String']['input']
}

/**  Metadata about a project secret — never its value.  */
export type ProjectSecretInfo = {
	readonly __typename?: 'ProjectSecretInfo'
	readonly createdAt: Scalars['DateTime']['output']
	readonly key: Scalars['String']['output']
	readonly updatedAt: Scalars['DateTime']['output']
}

export type Query = {
	readonly __typename?: 'Query'
	/**
	 * Read the tenant audit log (`person_auth_log`). Requires the
	 * `system:viewAuthLog` permission — by default granted only to
	 * SUPER_ADMIN via the wildcard ALL-resource/ALL-privilege grant.
	 * Ordered by created_at DESC. Page size is capped server-side
	 * (default 100, max 500); `hasMore` indicates a further page exists.
	 */
	readonly authLog: AuthLogPage
	/**
	 * List configured auth policies (per-role MFA / session policy). Requires the
	 * `system:configure` permission — by default granted only to SUPER_ADMIN
	 * (and PROJECT_ADMIN, like `configure`). With no rows configured, MFA
	 * enforcement is inert and sign-in behaves exactly as today.
	 */
	readonly authPolicies: ReadonlyArray<AuthPolicy>
	readonly checkResetPasswordToken: CheckResetPasswordTokenCode
	readonly configuration: Config
	/**
	 * List exact permission definitions grantable to a custom role. Requires
	 * the `customRole:view` permission.
	 */
	readonly customRolePermissions: ReadonlyArray<CustomRolePermissionDefinition>
	/**
	 * List custom roles (runtime-defined global roles carrying a bundle of tenant
	 * permissions). Requires the `customRole:view` permission — granted to
	 * SUPER_ADMIN by default and itself grantable to a custom role.
	 */
	readonly customRoles: ReadonlyArray<CustomRole>
	/**
	 * List global (project-independent) permanent API keys — those created via
	 * `createGlobalApiKey`, whose identity carries global roles and no project
	 * membership. Requires the `apiKey:list` permission — by default granted
	 * only to SUPER_ADMIN via the wildcard ALL-resource/ALL-privilege grant.
	 * Returns an empty list when the caller may not list them. To list a
	 * project's keys use `project.apiKeys`.
	 */
	readonly globalApiKeys: ReadonlyArray<ApiKey>
	readonly identityProviders: ReadonlyArray<IdentityProvider>
	readonly mailTemplates: ReadonlyArray<MailTemplateData>
	readonly me: Identity
	readonly personById?: Maybe<Person>
	/**
	 * List persons across the tenant. SUPER_ADMIN sees every person; otherwise
	 * the result is scoped to persons who are members of a project the caller may
	 * view members of (i.e. the same persons reachable via `project.members`),
	 * so a PROJECT_ADMIN sees only their projects' members. `filter` matches by
	 * e-mail (case-insensitive), `personId`, or `identityId`; `limit`/`offset`
	 * paginate. Returns an empty list when the caller may not list anyone.
	 */
	readonly persons: ReadonlyArray<Person>
	readonly projectBySlug?: Maybe<Project>
	readonly projectMemberships: ReadonlyArray<Membership>
	readonly projects: ReadonlyArray<Project>
}

export type QueryAuthLogArgs = {
	filter?: InputMaybe<AuthLogFilter>
	limit?: InputMaybe<Scalars['Int']['input']>
	offset?: InputMaybe<Scalars['Int']['input']>
}

export type QueryCheckResetPasswordTokenArgs = {
	requestId: Scalars['String']['input']
	token: Scalars['String']['input']
}

export type QueryPersonByIdArgs = {
	id: Scalars['String']['input']
}

export type QueryPersonsArgs = {
	filter?: InputMaybe<PersonsFilter>
	limit?: InputMaybe<Scalars['Int']['input']>
	offset?: InputMaybe<Scalars['Int']['input']>
}

export type QueryProjectBySlugArgs = {
	slug: Scalars['String']['input']
}

export type QueryProjectMembershipsArgs = {
	identityId: Scalars['String']['input']
	projectSlug: Scalars['String']['input']
}

export type RegenerateBackupCodesError = {
	readonly __typename?: 'RegenerateBackupCodesError'
	readonly code: RegenerateBackupCodesErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type RegenerateBackupCodesErrorCode = 'OTP_NOT_ACTIVE'

export type RegenerateBackupCodesResponse = {
	readonly __typename?: 'RegenerateBackupCodesResponse'
	readonly error?: Maybe<RegenerateBackupCodesError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<RegenerateBackupCodesResult>
}

export type RegenerateBackupCodesResult = {
	readonly __typename?: 'RegenerateBackupCodesResult'
	readonly backupCodes: ReadonlyArray<Scalars['String']['output']>
}

export type RemoveGlobalIdentityRolesError = {
	readonly __typename?: 'RemoveGlobalIdentityRolesError'
	readonly code: RemoveGlobalIdentityRolesErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type RemoveGlobalIdentityRolesErrorCode =
	| 'IDENTITY_NOT_FOUND'
	| 'INVALID_ROLE'

export type RemoveGlobalIdentityRolesResponse = {
	readonly __typename?: 'RemoveGlobalIdentityRolesResponse'
	readonly error?: Maybe<RemoveGlobalIdentityRolesError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<RemoveGlobalIdentityRolesResult>
}

export type RemoveGlobalIdentityRolesResult = {
	readonly __typename?: 'RemoveGlobalIdentityRolesResult'
	readonly identity: Identity
}

export type RemoveMailTemplateError = {
	readonly __typename?: 'RemoveMailTemplateError'
	readonly code: RemoveMailTemplateErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type RemoveMailTemplateErrorCode =
	| 'PROJECT_NOT_FOUND'
	| 'TEMPLATE_NOT_FOUND'

export type RemoveMailTemplateResponse = {
	readonly __typename?: 'RemoveMailTemplateResponse'
	readonly error?: Maybe<RemoveMailTemplateError>
	readonly errors: ReadonlyArray<RemoveMailTemplateError>
	readonly ok: Scalars['Boolean']['output']
}

export type RemoveProjectMemberError = {
	readonly __typename?: 'RemoveProjectMemberError'
	readonly code: RemoveProjectMemberErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type RemoveProjectMemberErrorCode =
	| 'NOT_MEMBER'
	| 'PROJECT_NOT_FOUND'

export type RemoveProjectMemberResponse = {
	readonly __typename?: 'RemoveProjectMemberResponse'
	readonly error?: Maybe<RemoveProjectMemberError>
	readonly errors: ReadonlyArray<RemoveProjectMemberError>
	readonly ok: Scalars['Boolean']['output']
}

export type RequestEmailVerificationError = {
	readonly __typename?: 'RequestEmailVerificationError'
	readonly code: RequestEmailVerificationErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type RequestEmailVerificationErrorCode =
	| 'INVALID_CAPTCHA'
	| 'RATE_LIMIT_EXCEEDED'

export type RequestEmailVerificationResponse = {
	readonly __typename?: 'RequestEmailVerificationResponse'
	readonly error?: Maybe<RequestEmailVerificationError>
	readonly ok: Scalars['Boolean']['output']
}

export type ResetPasswordError = {
	readonly __typename?: 'ResetPasswordError'
	readonly code: ResetPasswordErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
	readonly weakPasswordReasons?: Maybe<ReadonlyArray<WeakPasswordReason>>
}

export type ResetPasswordErrorCode =
	| 'PASSWORD_TOO_WEAK'
	| 'TOKEN_EXPIRED'
	| 'TOKEN_INVALID'
	| 'TOKEN_NOT_FOUND'
	| 'TOKEN_USED'

export type ResetPasswordResponse = {
	readonly __typename?: 'ResetPasswordResponse'
	readonly error?: Maybe<ResetPasswordError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<ResetPasswordError>
	readonly ok: Scalars['Boolean']['output']
}

export type ResetPersonMfaError = {
	readonly __typename?: 'ResetPersonMfaError'
	readonly code: ResetPersonMfaErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ResetPersonMfaErrorCode = 'PERSON_NOT_FOUND'

export type ResetPersonMfaResponse = {
	readonly __typename?: 'ResetPersonMfaResponse'
	readonly error?: Maybe<ResetPersonMfaError>
	readonly ok: Scalars['Boolean']['output']
}

export type RevokeSessionError = {
	readonly __typename?: 'RevokeSessionError'
	readonly code: RevokeSessionErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type RevokeSessionErrorCode =
	| 'NOT_A_PERSON'
	| 'SESSION_NOT_FOUND'

export type RevokeSessionResponse = {
	readonly __typename?: 'RevokeSessionResponse'
	readonly error?: Maybe<RevokeSessionError>
	readonly ok: Scalars['Boolean']['output']
}

export type RoleConditionVariableDefinition = RoleVariableDefinition & {
	readonly __typename?: 'RoleConditionVariableDefinition'
	readonly name: Scalars['String']['output']
}

export type RoleDefinition = {
	readonly __typename?: 'RoleDefinition'
	readonly name: Scalars['String']['output']
	readonly variables: ReadonlyArray<RoleVariableDefinition>
}

export type RoleEntityVariableDefinition = RoleVariableDefinition & {
	readonly __typename?: 'RoleEntityVariableDefinition'
	readonly entityName: Scalars['String']['output']
	readonly name: Scalars['String']['output']
}

export type RolePredefinedVariableDefinition = RoleVariableDefinition & {
	readonly __typename?: 'RolePredefinedVariableDefinition'
	readonly name: Scalars['String']['output']
	readonly value: Scalars['String']['output']
}

export type RoleVariableDefinition = {
	readonly name: Scalars['String']['output']
}

export type SessionInfo = {
	readonly __typename?: 'SessionInfo'
	readonly createdAt: Scalars['DateTime']['output']
	readonly createdIp?: Maybe<Scalars['String']['output']>
	readonly createdUserAgent?: Maybe<Scalars['String']['output']>
	readonly expiresAt?: Maybe<Scalars['DateTime']['output']>
	readonly id: Scalars['String']['output']
	readonly isCurrent: Scalars['Boolean']['output']
	readonly lastIp?: Maybe<Scalars['String']['output']>
	readonly lastUsedAt?: Maybe<Scalars['DateTime']['output']>
	readonly lastUserAgent?: Maybe<Scalars['String']['output']>
	/**
	 * Whether this session honors X-Contember-Client-IP /
	 * X-Contember-Client-User-Agent headers on subsequent requests. Set when
	 * the session was minted via `SignInOptions.trustForwardedClientInfo`
	 * from an api_key that was itself created with the flag.
	 */
	readonly trustForwardedClientInfo: Scalars['Boolean']['output']
}

export type SetProjectSecretError = {
	readonly __typename?: 'SetProjectSecretError'
	readonly code: SetProjectSecretErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type SetProjectSecretErrorCode = 'PROJECT_NOT_FOUND'

export type SetProjectSecretResponse = {
	readonly __typename?: 'SetProjectSecretResponse'
	readonly error?: Maybe<SetProjectSecretError>
	readonly ok: Scalars['Boolean']['output']
}

export type SignInError = {
	readonly __typename?: 'SignInError'
	readonly code: SignInErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
	/**
	 * Set only on a MFA_ENROLLMENT_REQUIRED error: the freshly provisioned
	 * pending TOTP secret the client must enroll (show the QR / secret, then
	 * retry signIn with otpToken). Additive — clients that don't read it are
	 * unaffected.
	 */
	readonly mfaEnrollment?: Maybe<MfaEnrollment>
	readonly retryAfter?: Maybe<Scalars['Int']['output']>
}

export type SignInErrorCode =
	| 'EMAIL_NOT_VERIFIED'
	| 'INVALID_CREDENTIALS'
	| 'INVALID_OTP_TOKEN'
	| 'INVALID_PASSWORD'
	| 'MFA_ENROLLMENT_REQUIRED'
	| 'NO_PASSWORD_SET'
	| 'OTP_REQUIRED'
	| 'PERSON_DISABLED'
	| 'RATE_LIMIT_EXCEEDED'
	| 'UNKNOWN_EMAIL'

export type SignInIdpError = {
	readonly __typename?: 'SignInIDPError'
	readonly code: SignInIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type SignInIdpErrorCode =
	| 'IDP_VALIDATION_FAILED'
	| 'INVALID_IDP_RESPONSE'
	| 'PERSON_ALREADY_EXISTS'
	| 'PERSON_DISABLED'
	| 'PERSON_NOT_FOUND'

export type SignInIdpResponse = {
	readonly __typename?: 'SignInIDPResponse'
	readonly error?: Maybe<SignInIdpError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<SignInIdpError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<SignInIdpResult>
}

export type SignInIdpResult = CommonSignInResult & {
	readonly __typename?: 'SignInIDPResult'
	readonly idpResponse?: Maybe<Scalars['Json']['output']>
	readonly person: Person
	readonly token: Scalars['String']['output']
}

export type SignInOptions = {
	/**
	 * If true, and the calling api_key has trust_forwarded_info=true,
	 * the resulting session token will trust X-Contember-Client-IP and
	 * X-Contember-Client-User-Agent headers on subsequent requests.
	 * Silently ignored when the caller's api_key does not have the flag.
	 *
	 * Security: a proxy that sets these headers MUST strip any
	 * incoming X-Contember-Client-IP / X-Contember-Client-User-Agent
	 * from upstream traffic and re-inject values it trusts. Without
	 * that, any client holding a session token minted with this flag
	 * could spoof its own IP/User-Agent.
	 */
	readonly trustForwardedClientInfo?: InputMaybe<Scalars['Boolean']['input']>
}

export type SignInPasswordlessError = {
	readonly __typename?: 'SignInPasswordlessError'
	readonly code: SignInPasswordlessErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type SignInPasswordlessErrorCode =
	| 'INVALID_OTP_TOKEN'
	| 'MFA_ENROLLMENT_REQUIRED'
	| 'OTP_REQUIRED'
	| 'PERSON_DISABLED'
	| 'TOKEN_EXPIRED'
	| 'TOKEN_INVALID'
	| 'TOKEN_NOT_FOUND'
	| 'TOKEN_USED'

export type SignInPasswordlessResponse = {
	readonly __typename?: 'SignInPasswordlessResponse'
	readonly error?: Maybe<SignInPasswordlessError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<SignInPasswordlessResult>
}

export type SignInPasswordlessResult = CommonSignInResult & {
	readonly __typename?: 'SignInPasswordlessResult'
	readonly person: Person
	readonly token: Scalars['String']['output']
}

export type SignInResponse = {
	readonly __typename?: 'SignInResponse'
	readonly error?: Maybe<SignInError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<SignInError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<SignInResult>
}

export type SignInResult = CommonSignInResult & {
	readonly __typename?: 'SignInResult'
	/**
	 * Set only when this sign-in completed an MFA enrollment (A06): the freshly
	 * generated backup codes, shown exactly once. Null on a normal sign-in.
	 */
	readonly backupCodes?: Maybe<ReadonlyArray<Scalars['String']['output']>>
	readonly person: Person
	readonly token: Scalars['String']['output']
}

export type SignOutError = {
	readonly __typename?: 'SignOutError'
	readonly code: SignOutErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
}

export type SignOutErrorCode =
	| 'NOT_A_PERSON'
	| 'NOT_POSSIBLE_SIGN_OUT_WITH_PERMANENT_API_KEY'

export type SignOutResponse = {
	readonly __typename?: 'SignOutResponse'
	readonly error?: Maybe<SignOutError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<SignOutError>
	/**
	 * When the session was federated via an OIDC identity provider that supports RP-initiated
	 * (front-channel) logout, the URL the client should redirect the browser to so the user is
	 * also signed out at the IdP (Single Logout). Null for plain sessions or legacy IdPs without
	 * an end-session endpoint, in which case only a local logout happened.
	 */
	readonly logoutUrl?: Maybe<Scalars['String']['output']>
	readonly ok: Scalars['Boolean']['output']
}

export type SignUpError = {
	readonly __typename?: 'SignUpError'
	readonly code: SignUpErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endPersonMessage?: Maybe<Scalars['String']['output']>
	/**
	 * For EMAIL_ALREADY_EXISTS, the recommended next action client UIs should
	 * offer to the visitor. Null for unrelated error codes.
	 */
	readonly recommendedAction?: Maybe<SignUpRecommendedAction>
	readonly weakPasswordReasons?: Maybe<ReadonlyArray<WeakPasswordReason>>
}

export type SignUpErrorCode =
	| 'EMAIL_ALREADY_EXISTS'
	| 'INVALID_CAPTCHA'
	| 'INVALID_EMAIL_FORMAT'
	| 'INVALID_ROLE'
	| 'RATE_LIMIT_EXCEEDED'
	| 'TOO_WEAK'

export type SignUpRecommendedAction =
	| 'RESET_PASSWORD'
	| 'SIGN_IN'

export type SignUpResponse = {
	readonly __typename?: 'SignUpResponse'
	readonly error?: Maybe<SignUpError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<SignUpError>
	readonly ok: Scalars['Boolean']['output']
	readonly result?: Maybe<SignUpResult>
}

export type SignUpResult = {
	readonly __typename?: 'SignUpResult'
	readonly person: Person
}

export type ToggleMyPasswordlessError = {
	readonly __typename?: 'ToggleMyPasswordlessError'
	readonly code: ToggleMyPasswordlessErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type ToggleMyPasswordlessErrorCode =
	| 'CANNOT_TOGGLE'
	| 'NOT_A_PERSON'

export type ToggleMyPasswordlessResponse = {
	readonly __typename?: 'ToggleMyPasswordlessResponse'
	readonly error?: Maybe<ToggleMyPasswordlessError>
	readonly ok: Scalars['Boolean']['output']
}

export type UnmanagedInviteOptions = {
	readonly password?: InputMaybe<Scalars['String']['input']>
	readonly resetTokenHash?: InputMaybe<Scalars['String']['input']>
}

export type UpdateAuthPolicyError = {
	readonly __typename?: 'UpdateAuthPolicyError'
	readonly code: UpdateAuthPolicyErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type UpdateAuthPolicyErrorCode =
	| 'NOT_FOUND'
	| 'PROJECT_NOT_ALLOWED'
	| 'PROJECT_NOT_FOUND'
	| 'PROJECT_REQUIRED'

export type UpdateAuthPolicyResponse = {
	readonly __typename?: 'UpdateAuthPolicyResponse'
	readonly error?: Maybe<UpdateAuthPolicyError>
	readonly ok: Scalars['Boolean']['output']
}

export type UpdateCustomRoleError = {
	readonly __typename?: 'UpdateCustomRoleError'
	readonly code: UpdateCustomRoleErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type UpdateCustomRoleErrorCode =
	| 'DUPLICATE_PERMISSION'
	| 'INVALID_PERMISSION_CONFIGURATION'
	| 'NOT_FOUND'
	| 'UNKNOWN_PERMISSION'

export type UpdateCustomRoleResponse = {
	readonly __typename?: 'UpdateCustomRoleResponse'
	readonly error?: Maybe<UpdateCustomRoleError>
	readonly ok: Scalars['Boolean']['output']
}

export type UpdateIdpError = {
	readonly __typename?: 'UpdateIDPError'
	readonly code: UpdateIdpErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type UpdateIdpErrorCode =
	| 'INVALID_CONFIGURATION'
	| 'NOT_FOUND'

export type UpdateIdpResponse = {
	readonly __typename?: 'UpdateIDPResponse'
	readonly error?: Maybe<UpdateIdpError>
	readonly ok: Scalars['Boolean']['output']
}

export type UpdateProjectError = {
	readonly __typename?: 'UpdateProjectError'
	readonly code: UpdateProjectErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type UpdateProjectErrorCode = 'PROJECT_NOT_FOUND'

export type UpdateProjectMemberError = {
	readonly __typename?: 'UpdateProjectMemberError'
	readonly code: UpdateProjectMemberErrorCode
	readonly developerMessage: Scalars['String']['output']
	/** @deprecated Field no longer supported */
	readonly endUserMessage?: Maybe<Scalars['String']['output']>
	readonly membershipValidation?: Maybe<ReadonlyArray<MembershipValidationError>>
}

export type UpdateProjectMemberErrorCode =
	| 'INVALID_MEMBERSHIP'
	| 'NOT_MEMBER'
	| 'PROJECT_NOT_FOUND'
	| 'ROLE_NOT_FOUND'
	| 'VARIABLE_EMPTY'
	| 'VARIABLE_NOT_FOUND'

export type UpdateProjectMemberResponse = {
	readonly __typename?: 'UpdateProjectMemberResponse'
	readonly error?: Maybe<UpdateProjectMemberError>
	/** @deprecated Field no longer supported */
	readonly errors: ReadonlyArray<UpdateProjectMemberError>
	readonly ok: Scalars['Boolean']['output']
}

export type UpdateProjectResponse = {
	readonly __typename?: 'UpdateProjectResponse'
	readonly error?: Maybe<UpdateProjectError>
	readonly ok: Scalars['Boolean']['output']
}

export type VariableEntry = {
	readonly __typename?: 'VariableEntry'
	readonly name: Scalars['String']['output']
	readonly values: ReadonlyArray<Scalars['String']['output']>
}

export type VariableEntryInput = {
	readonly name: Scalars['String']['input']
	readonly values: ReadonlyArray<Scalars['String']['input']>
}

export type VerifyEmailError = {
	readonly __typename?: 'VerifyEmailError'
	readonly code: VerifyEmailErrorCode
	readonly developerMessage: Scalars['String']['output']
}

export type VerifyEmailErrorCode =
	| 'TOKEN_EXPIRED'
	| 'TOKEN_INVALID'
	| 'TOKEN_NOT_FOUND'
	| 'TOKEN_USED'

export type VerifyEmailResponse = {
	readonly __typename?: 'VerifyEmailResponse'
	readonly error?: Maybe<VerifyEmailError>
	readonly ok: Scalars['Boolean']['output']
}

export type WeakPasswordReason =
	| 'BLACKLISTED'
	| 'COMPROMISED'
	| 'INVALID_PATTERN'
	| 'MISSING_DIGIT'
	| 'MISSING_LOWERCASE'
	| 'MISSING_SPECIAL'
	| 'MISSING_UPPERCASE'
	| 'TOO_SHORT'

export type ResolverTypeWrapper<T> = Promise<T> | T

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
	resolve: ResolverFn<TResult, TParent, TContext, TArgs>
}
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
	| ResolverFn<TResult, TParent, TContext, TArgs>
	| ResolverWithResolve<TResult, TParent, TContext, TArgs>

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => Promise<TResult> | TResult

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
	subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>
	resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
	subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>
	resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
	| SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
	| SubscriptionResolverObject<TResult, TParent, TContext, TArgs>

export type SubscriptionResolver<
	TResult,
	TKey extends string,
	TParent = Record<PropertyKey, never>,
	TContext = Record<PropertyKey, never>,
	TArgs = Record<PropertyKey, never>,
> =
	| ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
	| SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
	parent: TParent,
	context: TContext,
	info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
	obj: T,
	context: TContext,
	info: GraphQLResolveInfo,
) => boolean | Promise<boolean>

export type NextResolverFn<T> = () => Promise<T>

export type DirectiveResolverFn<
	TResult = Record<PropertyKey, never>,
	TParent = Record<PropertyKey, never>,
	TContext = Record<PropertyKey, never>,
	TArgs = Record<PropertyKey, never>,
> = (
	next: NextResolverFn<TResult>,
	parent: TParent,
	args: TArgs,
	context: TContext,
	info: GraphQLResolveInfo,
) => TResult | Promise<TResult>

/** Mapping of interface types */
export type ResolversInterfaceTypes<_RefType extends Record<string, unknown>> = {
	CommonSignInResult:
		| (CreateSessionTokenResult)
		| (SignInIdpResult)
		| (SignInPasswordlessResult)
		| (SignInResult)
	RoleVariableDefinition:
		| (RoleConditionVariableDefinition)
		| (RoleEntityVariableDefinition)
		| (RolePredefinedVariableDefinition)
}

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
	ActivatePasswordlessOtpError: ResolverTypeWrapper<ActivatePasswordlessOtpError>
	ActivatePasswordlessOtpErrorCode: ActivatePasswordlessOtpErrorCode
	ActivatePasswordlessOtpResponse: ResolverTypeWrapper<ActivatePasswordlessOtpResponse>
	AddGlobalIdentityRolesError: ResolverTypeWrapper<AddGlobalIdentityRolesError>
	AddGlobalIdentityRolesErrorCode: AddGlobalIdentityRolesErrorCode
	AddGlobalIdentityRolesResponse: ResolverTypeWrapper<
		Omit<AddGlobalIdentityRolesResponse, 'result'> & { result?: Maybe<ResolversTypes['AddGlobalIdentityRolesResult']> }
	>
	AddGlobalIdentityRolesResult: ResolverTypeWrapper<Omit<AddGlobalIdentityRolesResult, 'identity'> & { identity: ResolversTypes['Identity'] }>
	AddIDPError: ResolverTypeWrapper<AddIdpError>
	AddIDPErrorCode: AddIdpErrorCode
	AddIDPResponse: ResolverTypeWrapper<AddIdpResponse>
	AddMailTemplateError: ResolverTypeWrapper<AddMailTemplateError>
	AddMailTemplateErrorCode: AddMailTemplateErrorCode
	AddMailTemplateResponse: ResolverTypeWrapper<AddMailTemplateResponse>
	AddProjectMemberError: ResolverTypeWrapper<AddProjectMemberError>
	AddProjectMemberErrorCode: AddProjectMemberErrorCode
	AddProjectMemberResponse: ResolverTypeWrapper<AddProjectMemberResponse>
	ApiKey: ResolverTypeWrapper<Omit<ApiKey, 'identity'> & { identity: ResolversTypes['Identity'] }>
	ApiKeyType: ApiKeyType
	ApiKeyWithToken: ResolverTypeWrapper<Omit<ApiKeyWithToken, 'identity'> & { identity: ResolversTypes['Identity'] }>
	AuthLogEntry: ResolverTypeWrapper<AuthLogEntry>
	AuthLogFilter: AuthLogFilter
	AuthLogPage: ResolverTypeWrapper<AuthLogPage>
	AuthPolicy: ResolverTypeWrapper<AuthPolicy>
	AuthPolicyInput: AuthPolicyInput
	AuthPolicyScope: AuthPolicyScope
	Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>
	CaptchaProvider: CaptchaProvider
	ChangeMyPasswordError: ResolverTypeWrapper<ChangeMyPasswordError>
	ChangeMyPasswordErrorCode: ChangeMyPasswordErrorCode
	ChangeMyPasswordResponse: ResolverTypeWrapper<ChangeMyPasswordResponse>
	ChangeMyProfileError: ResolverTypeWrapper<ChangeMyProfileError>
	ChangeMyProfileErrorCode: ChangeMyProfileErrorCode
	ChangeMyProfileResponse: ResolverTypeWrapper<ChangeMyProfileResponse>
	ChangePasswordError: ResolverTypeWrapper<ChangePasswordError>
	ChangePasswordErrorCode: ChangePasswordErrorCode
	ChangePasswordResponse: ResolverTypeWrapper<ChangePasswordResponse>
	ChangeProfileError: ResolverTypeWrapper<ChangeProfileError>
	ChangeProfileErrorCode: ChangeProfileErrorCode
	ChangeProfileResponse: ResolverTypeWrapper<ChangeProfileResponse>
	CheckResetPasswordTokenCode: CheckResetPasswordTokenCode
	CheckResetPasswordTokenResult: ResolverTypeWrapper<CheckResetPasswordTokenResult>
	CommonSignInResult: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['CommonSignInResult']>
	Config: ResolverTypeWrapper<Config>
	ConfigCaptcha: ResolverTypeWrapper<ConfigCaptcha>
	ConfigCaptchaInput: ConfigCaptchaInput
	ConfigCaptchaProtect: ResolverTypeWrapper<ConfigCaptchaProtect>
	ConfigCaptchaProtectInput: ConfigCaptchaProtectInput
	ConfigEmailChange: ResolverTypeWrapper<ConfigEmailChange>
	ConfigEmailChangeInput: ConfigEmailChangeInput
	ConfigInput: ConfigInput
	ConfigLogin: ResolverTypeWrapper<ConfigLogin>
	ConfigLoginAnomalyDetection: ResolverTypeWrapper<ConfigLoginAnomalyDetection>
	ConfigLoginAnomalyDetectionInput: ConfigLoginAnomalyDetectionInput
	ConfigLoginInput: ConfigLoginInput
	ConfigPassword: ResolverTypeWrapper<ConfigPassword>
	ConfigPasswordInput: ConfigPasswordInput
	ConfigPasswordless: ResolverTypeWrapper<ConfigPasswordless>
	ConfigPasswordlessInput: ConfigPasswordlessInput
	ConfigPolicy: ConfigPolicy
	ConfigRateLimitWindow: ResolverTypeWrapper<ConfigRateLimitWindow>
	ConfigRateLimitWindowInput: ConfigRateLimitWindowInput
	ConfigRateLimits: ResolverTypeWrapper<ConfigRateLimits>
	ConfigRateLimitsInput: ConfigRateLimitsInput
	ConfigSignup: ResolverTypeWrapper<ConfigSignup>
	ConfigSignupInput: ConfigSignupInput
	ConfigureError: ResolverTypeWrapper<ConfigureError>
	ConfigureErrorCode: ConfigureErrorCode
	ConfigureResponse: ResolverTypeWrapper<ConfigureResponse>
	ConfirmEmailChangeError: ResolverTypeWrapper<ConfirmEmailChangeError>
	ConfirmEmailChangeErrorCode: ConfirmEmailChangeErrorCode
	ConfirmEmailChangeResponse: ResolverTypeWrapper<ConfirmEmailChangeResponse>
	ConfirmEmailOtpError: ResolverTypeWrapper<ConfirmEmailOtpError>
	ConfirmEmailOtpErrorCode: ConfirmEmailOtpErrorCode
	ConfirmEmailOtpResponse: ResolverTypeWrapper<ConfirmEmailOtpResponse>
	ConfirmEmailOtpResult: ResolverTypeWrapper<ConfirmEmailOtpResult>
	ConfirmOtpError: ResolverTypeWrapper<ConfirmOtpError>
	ConfirmOtpErrorCode: ConfirmOtpErrorCode
	ConfirmOtpResponse: ResolverTypeWrapper<ConfirmOtpResponse>
	ConfirmOtpResult: ResolverTypeWrapper<ConfirmOtpResult>
	CreateApiKeyError: ResolverTypeWrapper<CreateApiKeyError>
	CreateApiKeyErrorCode: CreateApiKeyErrorCode
	CreateApiKeyOptions: CreateApiKeyOptions
	CreateApiKeyResponse: ResolverTypeWrapper<Omit<CreateApiKeyResponse, 'result'> & { result?: Maybe<ResolversTypes['CreateApiKeyResult']> }>
	CreateApiKeyResult: ResolverTypeWrapper<Omit<CreateApiKeyResult, 'apiKey'> & { apiKey: ResolversTypes['ApiKeyWithToken'] }>
	CreateAuthPolicyError: ResolverTypeWrapper<CreateAuthPolicyError>
	CreateAuthPolicyErrorCode: CreateAuthPolicyErrorCode
	CreateAuthPolicyResponse: ResolverTypeWrapper<CreateAuthPolicyResponse>
	CreateAuthPolicyResult: ResolverTypeWrapper<CreateAuthPolicyResult>
	CreateCustomRoleError: ResolverTypeWrapper<CreateCustomRoleError>
	CreateCustomRoleErrorCode: CreateCustomRoleErrorCode
	CreateCustomRoleResponse: ResolverTypeWrapper<CreateCustomRoleResponse>
	CreatePasswordResetRequestError: ResolverTypeWrapper<CreatePasswordResetRequestError>
	CreatePasswordResetRequestErrorCode: CreatePasswordResetRequestErrorCode
	CreatePasswordResetRequestResponse: ResolverTypeWrapper<CreatePasswordResetRequestResponse>
	CreateProjectOptions: CreateProjectOptions
	CreateProjectResponse: ResolverTypeWrapper<Omit<CreateProjectResponse, 'result'> & { result?: Maybe<ResolversTypes['CreateProjectResult']> }>
	CreateProjectResponseError: ResolverTypeWrapper<CreateProjectResponseError>
	CreateProjectResponseErrorCode: CreateProjectResponseErrorCode
	CreateProjectResult: ResolverTypeWrapper<Omit<CreateProjectResult, 'deployerApiKey'> & { deployerApiKey?: Maybe<ResolversTypes['ApiKeyWithToken']> }>
	CreateResetPasswordRequestOptions: CreateResetPasswordRequestOptions
	CreateSessionTokenError: ResolverTypeWrapper<CreateSessionTokenError>
	CreateSessionTokenErrorCode: CreateSessionTokenErrorCode
	CreateSessionTokenResponse: ResolverTypeWrapper<CreateSessionTokenResponse>
	CreateSessionTokenResult: ResolverTypeWrapper<CreateSessionTokenResult>
	CustomRole: ResolverTypeWrapper<CustomRole>
	CustomRoleConfigurationKind: CustomRoleConfigurationKind
	CustomRoleGrant: ResolverTypeWrapper<CustomRoleGrant>
	CustomRoleGrantInput: CustomRoleGrantInput
	CustomRolePermissionDefinition: ResolverTypeWrapper<CustomRolePermissionDefinition>
	DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>
	DeleteAuthPolicyError: ResolverTypeWrapper<DeleteAuthPolicyError>
	DeleteAuthPolicyErrorCode: DeleteAuthPolicyErrorCode
	DeleteAuthPolicyResponse: ResolverTypeWrapper<DeleteAuthPolicyResponse>
	DeleteCustomRoleError: ResolverTypeWrapper<DeleteCustomRoleError>
	DeleteCustomRoleErrorCode: DeleteCustomRoleErrorCode
	DeleteCustomRoleResponse: ResolverTypeWrapper<DeleteCustomRoleResponse>
	DisableApiKeyError: ResolverTypeWrapper<DisableApiKeyError>
	DisableApiKeyErrorCode: DisableApiKeyErrorCode
	DisableApiKeyResponse: ResolverTypeWrapper<DisableApiKeyResponse>
	DisableEmailOtpError: ResolverTypeWrapper<DisableEmailOtpError>
	DisableEmailOtpErrorCode: DisableEmailOtpErrorCode
	DisableEmailOtpResponse: ResolverTypeWrapper<DisableEmailOtpResponse>
	DisableIDPError: ResolverTypeWrapper<DisableIdpError>
	DisableIDPErrorCode: DisableIdpErrorCode
	DisableIDPResponse: ResolverTypeWrapper<DisableIdpResponse>
	DisableOtpError: ResolverTypeWrapper<DisableOtpError>
	DisableOtpErrorCode: DisableOtpErrorCode
	DisableOtpResponse: ResolverTypeWrapper<DisableOtpResponse>
	DisablePersonError: ResolverTypeWrapper<DisablePersonError>
	DisablePersonErrorCode: DisablePersonErrorCode
	DisablePersonResponse: ResolverTypeWrapper<DisablePersonResponse>
	DisconnectIDPError: ResolverTypeWrapper<DisconnectIdpError>
	DisconnectIDPErrorCode: DisconnectIdpErrorCode
	DisconnectIDPResponse: ResolverTypeWrapper<DisconnectIdpResponse>
	EmailVerificationOptions: EmailVerificationOptions
	EnableIDPError: ResolverTypeWrapper<EnableIdpError>
	EnableIDPErrorCode: EnableIdpErrorCode
	EnableIDPResponse: ResolverTypeWrapper<EnableIdpResponse>
	Float: ResolverTypeWrapper<Scalars['Float']['output']>
	ForceSignOutPersonError: ResolverTypeWrapper<ForceSignOutPersonError>
	ForceSignOutPersonErrorCode: ForceSignOutPersonErrorCode
	ForceSignOutPersonResponse: ResolverTypeWrapper<ForceSignOutPersonResponse>
	IDPOptions: IdpOptions
	IDPOptionsOutput: ResolverTypeWrapper<IdpOptionsOutput>
	IDPResponseInput: IdpResponseInput
	Identity: ResolverTypeWrapper<
		Omit<Identity, 'apiKey' | 'projects'> & {
			apiKey?: Maybe<ResolversTypes['ApiKey']>
			projects: ReadonlyArray<ResolversTypes['IdentityProjectRelation']>
		}
	>
	IdentityGlobalPermissions: ResolverTypeWrapper<IdentityGlobalPermissions>
	IdentityProjectRelation: ResolverTypeWrapper<Omit<IdentityProjectRelation, 'project'> & { project: ResolversTypes['Project'] }>
	IdentityProvider: ResolverTypeWrapper<IdentityProvider>
	IdentityProviderListItem: ResolverTypeWrapper<IdentityProviderListItem>
	InitEmailOtpError: ResolverTypeWrapper<InitEmailOtpError>
	InitEmailOtpErrorCode: InitEmailOtpErrorCode
	InitEmailOtpResponse: ResolverTypeWrapper<InitEmailOtpResponse>
	InitSignInIDPError: ResolverTypeWrapper<InitSignInIdpError>
	InitSignInIDPErrorCode: InitSignInIdpErrorCode
	InitSignInIDPResponse: ResolverTypeWrapper<InitSignInIdpResponse>
	InitSignInIDPResult: ResolverTypeWrapper<InitSignInIdpResult>
	InitSignInPasswordlessError: ResolverTypeWrapper<InitSignInPasswordlessError>
	InitSignInPasswordlessErrorCode: InitSignInPasswordlessErrorCode
	InitSignInPasswordlessOptions: InitSignInPasswordlessOptions
	InitSignInPasswordlessResponse: ResolverTypeWrapper<InitSignInPasswordlessResponse>
	InitSignInPasswordlessResult: ResolverTypeWrapper<InitSignInPasswordlessResult>
	Int: ResolverTypeWrapper<Scalars['Int']['output']>
	Interval: ResolverTypeWrapper<Scalars['Interval']['output']>
	InviteError: ResolverTypeWrapper<InviteError>
	InviteErrorCode: InviteErrorCode
	InviteMethod: InviteMethod
	InviteOptions: InviteOptions
	InviteResponse: ResolverTypeWrapper<InviteResponse>
	InviteResult: ResolverTypeWrapper<InviteResult>
	Json: ResolverTypeWrapper<Scalars['Json']['output']>
	MailTemplate: MailTemplate
	MailTemplateData: ResolverTypeWrapper<MailTemplateData>
	MailTemplateIdentifier: MailTemplateIdentifier
	MailType: MailType
	MemberType: MemberType
	Membership: ResolverTypeWrapper<Membership>
	MembershipInput: MembershipInput
	MembershipValidationError: ResolverTypeWrapper<MembershipValidationError>
	MembershipValidationErrorCode: MembershipValidationErrorCode
	MfaEnrollment: ResolverTypeWrapper<MfaEnrollment>
	Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>
	PasswordlessValidationType: PasswordlessValidationType
	Person: ResolverTypeWrapper<Omit<Person, 'identity'> & { identity: ResolversTypes['Identity'] }>
	PersonIdentityProvider: ResolverTypeWrapper<PersonIdentityProvider>
	PersonsFilter: PersonsFilter
	PrepareOtpResponse: ResolverTypeWrapper<PrepareOtpResponse>
	PrepareOtpResult: ResolverTypeWrapper<PrepareOtpResult>
	Project: ResolverTypeWrapper<
		Omit<Project, 'apiKeys' | 'members' | 'roles'> & {
			apiKeys: ReadonlyArray<ResolversTypes['ApiKey']>
			members: ReadonlyArray<ResolversTypes['ProjectIdentityRelation']>
			roles: ReadonlyArray<ResolversTypes['RoleDefinition']>
		}
	>
	ProjectIdentityRelation: ResolverTypeWrapper<Omit<ProjectIdentityRelation, 'identity'> & { identity: ResolversTypes['Identity'] }>
	ProjectMembersFilter: ProjectMembersFilter
	ProjectMembersInput: ProjectMembersInput
	ProjectSecret: ProjectSecret
	ProjectSecretInfo: ResolverTypeWrapper<ProjectSecretInfo>
	Query: ResolverTypeWrapper<Record<PropertyKey, never>>
	RegenerateBackupCodesError: ResolverTypeWrapper<RegenerateBackupCodesError>
	RegenerateBackupCodesErrorCode: RegenerateBackupCodesErrorCode
	RegenerateBackupCodesResponse: ResolverTypeWrapper<RegenerateBackupCodesResponse>
	RegenerateBackupCodesResult: ResolverTypeWrapper<RegenerateBackupCodesResult>
	RemoveGlobalIdentityRolesError: ResolverTypeWrapper<RemoveGlobalIdentityRolesError>
	RemoveGlobalIdentityRolesErrorCode: RemoveGlobalIdentityRolesErrorCode
	RemoveGlobalIdentityRolesResponse: ResolverTypeWrapper<
		Omit<RemoveGlobalIdentityRolesResponse, 'result'> & { result?: Maybe<ResolversTypes['RemoveGlobalIdentityRolesResult']> }
	>
	RemoveGlobalIdentityRolesResult: ResolverTypeWrapper<Omit<RemoveGlobalIdentityRolesResult, 'identity'> & { identity: ResolversTypes['Identity'] }>
	RemoveMailTemplateError: ResolverTypeWrapper<RemoveMailTemplateError>
	RemoveMailTemplateErrorCode: RemoveMailTemplateErrorCode
	RemoveMailTemplateResponse: ResolverTypeWrapper<RemoveMailTemplateResponse>
	RemoveProjectMemberError: ResolverTypeWrapper<RemoveProjectMemberError>
	RemoveProjectMemberErrorCode: RemoveProjectMemberErrorCode
	RemoveProjectMemberResponse: ResolverTypeWrapper<RemoveProjectMemberResponse>
	RequestEmailVerificationError: ResolverTypeWrapper<RequestEmailVerificationError>
	RequestEmailVerificationErrorCode: RequestEmailVerificationErrorCode
	RequestEmailVerificationResponse: ResolverTypeWrapper<RequestEmailVerificationResponse>
	ResetPasswordError: ResolverTypeWrapper<ResetPasswordError>
	ResetPasswordErrorCode: ResetPasswordErrorCode
	ResetPasswordResponse: ResolverTypeWrapper<ResetPasswordResponse>
	ResetPersonMfaError: ResolverTypeWrapper<ResetPersonMfaError>
	ResetPersonMfaErrorCode: ResetPersonMfaErrorCode
	ResetPersonMfaResponse: ResolverTypeWrapper<ResetPersonMfaResponse>
	RevokeSessionError: ResolverTypeWrapper<RevokeSessionError>
	RevokeSessionErrorCode: RevokeSessionErrorCode
	RevokeSessionResponse: ResolverTypeWrapper<RevokeSessionResponse>
	RoleConditionVariableDefinition: ResolverTypeWrapper<RoleConditionVariableDefinition>
	RoleDefinition: ResolverTypeWrapper<Omit<RoleDefinition, 'variables'> & { variables: ReadonlyArray<ResolversTypes['RoleVariableDefinition']> }>
	RoleEntityVariableDefinition: ResolverTypeWrapper<RoleEntityVariableDefinition>
	RolePredefinedVariableDefinition: ResolverTypeWrapper<RolePredefinedVariableDefinition>
	RoleVariableDefinition: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['RoleVariableDefinition']>
	SessionInfo: ResolverTypeWrapper<SessionInfo>
	SetProjectSecretError: ResolverTypeWrapper<SetProjectSecretError>
	SetProjectSecretErrorCode: SetProjectSecretErrorCode
	SetProjectSecretResponse: ResolverTypeWrapper<SetProjectSecretResponse>
	SignInError: ResolverTypeWrapper<SignInError>
	SignInErrorCode: SignInErrorCode
	SignInIDPError: ResolverTypeWrapper<SignInIdpError>
	SignInIDPErrorCode: SignInIdpErrorCode
	SignInIDPResponse: ResolverTypeWrapper<SignInIdpResponse>
	SignInIDPResult: ResolverTypeWrapper<SignInIdpResult>
	SignInOptions: SignInOptions
	SignInPasswordlessError: ResolverTypeWrapper<SignInPasswordlessError>
	SignInPasswordlessErrorCode: SignInPasswordlessErrorCode
	SignInPasswordlessResponse: ResolverTypeWrapper<SignInPasswordlessResponse>
	SignInPasswordlessResult: ResolverTypeWrapper<SignInPasswordlessResult>
	SignInResponse: ResolverTypeWrapper<SignInResponse>
	SignInResult: ResolverTypeWrapper<SignInResult>
	SignOutError: ResolverTypeWrapper<SignOutError>
	SignOutErrorCode: SignOutErrorCode
	SignOutResponse: ResolverTypeWrapper<SignOutResponse>
	SignUpError: ResolverTypeWrapper<SignUpError>
	SignUpErrorCode: SignUpErrorCode
	SignUpRecommendedAction: SignUpRecommendedAction
	SignUpResponse: ResolverTypeWrapper<SignUpResponse>
	SignUpResult: ResolverTypeWrapper<SignUpResult>
	String: ResolverTypeWrapper<Scalars['String']['output']>
	ToggleMyPasswordlessError: ResolverTypeWrapper<ToggleMyPasswordlessError>
	ToggleMyPasswordlessErrorCode: ToggleMyPasswordlessErrorCode
	ToggleMyPasswordlessResponse: ResolverTypeWrapper<ToggleMyPasswordlessResponse>
	UnmanagedInviteOptions: UnmanagedInviteOptions
	UpdateAuthPolicyError: ResolverTypeWrapper<UpdateAuthPolicyError>
	UpdateAuthPolicyErrorCode: UpdateAuthPolicyErrorCode
	UpdateAuthPolicyResponse: ResolverTypeWrapper<UpdateAuthPolicyResponse>
	UpdateCustomRoleError: ResolverTypeWrapper<UpdateCustomRoleError>
	UpdateCustomRoleErrorCode: UpdateCustomRoleErrorCode
	UpdateCustomRoleResponse: ResolverTypeWrapper<UpdateCustomRoleResponse>
	UpdateIDPError: ResolverTypeWrapper<UpdateIdpError>
	UpdateIDPErrorCode: UpdateIdpErrorCode
	UpdateIDPResponse: ResolverTypeWrapper<UpdateIdpResponse>
	UpdateProjectError: ResolverTypeWrapper<UpdateProjectError>
	UpdateProjectErrorCode: UpdateProjectErrorCode
	UpdateProjectMemberError: ResolverTypeWrapper<UpdateProjectMemberError>
	UpdateProjectMemberErrorCode: UpdateProjectMemberErrorCode
	UpdateProjectMemberResponse: ResolverTypeWrapper<UpdateProjectMemberResponse>
	UpdateProjectResponse: ResolverTypeWrapper<UpdateProjectResponse>
	VariableEntry: ResolverTypeWrapper<VariableEntry>
	VariableEntryInput: VariableEntryInput
	VerifyEmailError: ResolverTypeWrapper<VerifyEmailError>
	VerifyEmailErrorCode: VerifyEmailErrorCode
	VerifyEmailResponse: ResolverTypeWrapper<VerifyEmailResponse>
	WeakPasswordReason: WeakPasswordReason
}

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
	ActivatePasswordlessOtpError: ActivatePasswordlessOtpError
	ActivatePasswordlessOtpResponse: ActivatePasswordlessOtpResponse
	AddGlobalIdentityRolesError: AddGlobalIdentityRolesError
	AddGlobalIdentityRolesResponse: Omit<AddGlobalIdentityRolesResponse, 'result'> & {
		result?: Maybe<ResolversParentTypes['AddGlobalIdentityRolesResult']>
	}
	AddGlobalIdentityRolesResult: Omit<AddGlobalIdentityRolesResult, 'identity'> & { identity: ResolversParentTypes['Identity'] }
	AddIDPError: AddIdpError
	AddIDPResponse: AddIdpResponse
	AddMailTemplateError: AddMailTemplateError
	AddMailTemplateResponse: AddMailTemplateResponse
	AddProjectMemberError: AddProjectMemberError
	AddProjectMemberResponse: AddProjectMemberResponse
	ApiKey: Omit<ApiKey, 'identity'> & { identity: ResolversParentTypes['Identity'] }
	ApiKeyWithToken: Omit<ApiKeyWithToken, 'identity'> & { identity: ResolversParentTypes['Identity'] }
	AuthLogEntry: AuthLogEntry
	AuthLogFilter: AuthLogFilter
	AuthLogPage: AuthLogPage
	AuthPolicy: AuthPolicy
	AuthPolicyInput: AuthPolicyInput
	Boolean: Scalars['Boolean']['output']
	ChangeMyPasswordError: ChangeMyPasswordError
	ChangeMyPasswordResponse: ChangeMyPasswordResponse
	ChangeMyProfileError: ChangeMyProfileError
	ChangeMyProfileResponse: ChangeMyProfileResponse
	ChangePasswordError: ChangePasswordError
	ChangePasswordResponse: ChangePasswordResponse
	ChangeProfileError: ChangeProfileError
	ChangeProfileResponse: ChangeProfileResponse
	CheckResetPasswordTokenResult: CheckResetPasswordTokenResult
	CommonSignInResult: ResolversInterfaceTypes<ResolversParentTypes>['CommonSignInResult']
	Config: Config
	ConfigCaptcha: ConfigCaptcha
	ConfigCaptchaInput: ConfigCaptchaInput
	ConfigCaptchaProtect: ConfigCaptchaProtect
	ConfigCaptchaProtectInput: ConfigCaptchaProtectInput
	ConfigEmailChange: ConfigEmailChange
	ConfigEmailChangeInput: ConfigEmailChangeInput
	ConfigInput: ConfigInput
	ConfigLogin: ConfigLogin
	ConfigLoginAnomalyDetection: ConfigLoginAnomalyDetection
	ConfigLoginAnomalyDetectionInput: ConfigLoginAnomalyDetectionInput
	ConfigLoginInput: ConfigLoginInput
	ConfigPassword: ConfigPassword
	ConfigPasswordInput: ConfigPasswordInput
	ConfigPasswordless: ConfigPasswordless
	ConfigPasswordlessInput: ConfigPasswordlessInput
	ConfigRateLimitWindow: ConfigRateLimitWindow
	ConfigRateLimitWindowInput: ConfigRateLimitWindowInput
	ConfigRateLimits: ConfigRateLimits
	ConfigRateLimitsInput: ConfigRateLimitsInput
	ConfigSignup: ConfigSignup
	ConfigSignupInput: ConfigSignupInput
	ConfigureError: ConfigureError
	ConfigureResponse: ConfigureResponse
	ConfirmEmailChangeError: ConfirmEmailChangeError
	ConfirmEmailChangeResponse: ConfirmEmailChangeResponse
	ConfirmEmailOtpError: ConfirmEmailOtpError
	ConfirmEmailOtpResponse: ConfirmEmailOtpResponse
	ConfirmEmailOtpResult: ConfirmEmailOtpResult
	ConfirmOtpError: ConfirmOtpError
	ConfirmOtpResponse: ConfirmOtpResponse
	ConfirmOtpResult: ConfirmOtpResult
	CreateApiKeyError: CreateApiKeyError
	CreateApiKeyOptions: CreateApiKeyOptions
	CreateApiKeyResponse: Omit<CreateApiKeyResponse, 'result'> & { result?: Maybe<ResolversParentTypes['CreateApiKeyResult']> }
	CreateApiKeyResult: Omit<CreateApiKeyResult, 'apiKey'> & { apiKey: ResolversParentTypes['ApiKeyWithToken'] }
	CreateAuthPolicyError: CreateAuthPolicyError
	CreateAuthPolicyResponse: CreateAuthPolicyResponse
	CreateAuthPolicyResult: CreateAuthPolicyResult
	CreateCustomRoleError: CreateCustomRoleError
	CreateCustomRoleResponse: CreateCustomRoleResponse
	CreatePasswordResetRequestError: CreatePasswordResetRequestError
	CreatePasswordResetRequestResponse: CreatePasswordResetRequestResponse
	CreateProjectOptions: CreateProjectOptions
	CreateProjectResponse: Omit<CreateProjectResponse, 'result'> & { result?: Maybe<ResolversParentTypes['CreateProjectResult']> }
	CreateProjectResponseError: CreateProjectResponseError
	CreateProjectResult: Omit<CreateProjectResult, 'deployerApiKey'> & { deployerApiKey?: Maybe<ResolversParentTypes['ApiKeyWithToken']> }
	CreateResetPasswordRequestOptions: CreateResetPasswordRequestOptions
	CreateSessionTokenError: CreateSessionTokenError
	CreateSessionTokenResponse: CreateSessionTokenResponse
	CreateSessionTokenResult: CreateSessionTokenResult
	CustomRole: CustomRole
	CustomRoleGrant: CustomRoleGrant
	CustomRoleGrantInput: CustomRoleGrantInput
	CustomRolePermissionDefinition: CustomRolePermissionDefinition
	DateTime: Scalars['DateTime']['output']
	DeleteAuthPolicyError: DeleteAuthPolicyError
	DeleteAuthPolicyResponse: DeleteAuthPolicyResponse
	DeleteCustomRoleError: DeleteCustomRoleError
	DeleteCustomRoleResponse: DeleteCustomRoleResponse
	DisableApiKeyError: DisableApiKeyError
	DisableApiKeyResponse: DisableApiKeyResponse
	DisableEmailOtpError: DisableEmailOtpError
	DisableEmailOtpResponse: DisableEmailOtpResponse
	DisableIDPError: DisableIdpError
	DisableIDPResponse: DisableIdpResponse
	DisableOtpError: DisableOtpError
	DisableOtpResponse: DisableOtpResponse
	DisablePersonError: DisablePersonError
	DisablePersonResponse: DisablePersonResponse
	DisconnectIDPError: DisconnectIdpError
	DisconnectIDPResponse: DisconnectIdpResponse
	EmailVerificationOptions: EmailVerificationOptions
	EnableIDPError: EnableIdpError
	EnableIDPResponse: EnableIdpResponse
	Float: Scalars['Float']['output']
	ForceSignOutPersonError: ForceSignOutPersonError
	ForceSignOutPersonResponse: ForceSignOutPersonResponse
	IDPOptions: IdpOptions
	IDPOptionsOutput: IdpOptionsOutput
	IDPResponseInput: IdpResponseInput
	Identity: Omit<Identity, 'apiKey' | 'projects'> & {
		apiKey?: Maybe<ResolversParentTypes['ApiKey']>
		projects: ReadonlyArray<ResolversParentTypes['IdentityProjectRelation']>
	}
	IdentityGlobalPermissions: IdentityGlobalPermissions
	IdentityProjectRelation: Omit<IdentityProjectRelation, 'project'> & { project: ResolversParentTypes['Project'] }
	IdentityProvider: IdentityProvider
	IdentityProviderListItem: IdentityProviderListItem
	InitEmailOtpError: InitEmailOtpError
	InitEmailOtpResponse: InitEmailOtpResponse
	InitSignInIDPError: InitSignInIdpError
	InitSignInIDPResponse: InitSignInIdpResponse
	InitSignInIDPResult: InitSignInIdpResult
	InitSignInPasswordlessError: InitSignInPasswordlessError
	InitSignInPasswordlessOptions: InitSignInPasswordlessOptions
	InitSignInPasswordlessResponse: InitSignInPasswordlessResponse
	InitSignInPasswordlessResult: InitSignInPasswordlessResult
	Int: Scalars['Int']['output']
	Interval: Scalars['Interval']['output']
	InviteError: InviteError
	InviteOptions: InviteOptions
	InviteResponse: InviteResponse
	InviteResult: InviteResult
	Json: Scalars['Json']['output']
	MailTemplate: MailTemplate
	MailTemplateData: MailTemplateData
	MailTemplateIdentifier: MailTemplateIdentifier
	Membership: Membership
	MembershipInput: MembershipInput
	MembershipValidationError: MembershipValidationError
	MfaEnrollment: MfaEnrollment
	Mutation: Record<PropertyKey, never>
	Person: Omit<Person, 'identity'> & { identity: ResolversParentTypes['Identity'] }
	PersonIdentityProvider: PersonIdentityProvider
	PersonsFilter: PersonsFilter
	PrepareOtpResponse: PrepareOtpResponse
	PrepareOtpResult: PrepareOtpResult
	Project: Omit<Project, 'apiKeys' | 'members' | 'roles'> & {
		apiKeys: ReadonlyArray<ResolversParentTypes['ApiKey']>
		members: ReadonlyArray<ResolversParentTypes['ProjectIdentityRelation']>
		roles: ReadonlyArray<ResolversParentTypes['RoleDefinition']>
	}
	ProjectIdentityRelation: Omit<ProjectIdentityRelation, 'identity'> & { identity: ResolversParentTypes['Identity'] }
	ProjectMembersFilter: ProjectMembersFilter
	ProjectMembersInput: ProjectMembersInput
	ProjectSecret: ProjectSecret
	ProjectSecretInfo: ProjectSecretInfo
	Query: Record<PropertyKey, never>
	RegenerateBackupCodesError: RegenerateBackupCodesError
	RegenerateBackupCodesResponse: RegenerateBackupCodesResponse
	RegenerateBackupCodesResult: RegenerateBackupCodesResult
	RemoveGlobalIdentityRolesError: RemoveGlobalIdentityRolesError
	RemoveGlobalIdentityRolesResponse: Omit<RemoveGlobalIdentityRolesResponse, 'result'> & {
		result?: Maybe<ResolversParentTypes['RemoveGlobalIdentityRolesResult']>
	}
	RemoveGlobalIdentityRolesResult: Omit<RemoveGlobalIdentityRolesResult, 'identity'> & { identity: ResolversParentTypes['Identity'] }
	RemoveMailTemplateError: RemoveMailTemplateError
	RemoveMailTemplateResponse: RemoveMailTemplateResponse
	RemoveProjectMemberError: RemoveProjectMemberError
	RemoveProjectMemberResponse: RemoveProjectMemberResponse
	RequestEmailVerificationError: RequestEmailVerificationError
	RequestEmailVerificationResponse: RequestEmailVerificationResponse
	ResetPasswordError: ResetPasswordError
	ResetPasswordResponse: ResetPasswordResponse
	ResetPersonMfaError: ResetPersonMfaError
	ResetPersonMfaResponse: ResetPersonMfaResponse
	RevokeSessionError: RevokeSessionError
	RevokeSessionResponse: RevokeSessionResponse
	RoleConditionVariableDefinition: RoleConditionVariableDefinition
	RoleDefinition: Omit<RoleDefinition, 'variables'> & { variables: ReadonlyArray<ResolversParentTypes['RoleVariableDefinition']> }
	RoleEntityVariableDefinition: RoleEntityVariableDefinition
	RolePredefinedVariableDefinition: RolePredefinedVariableDefinition
	RoleVariableDefinition: ResolversInterfaceTypes<ResolversParentTypes>['RoleVariableDefinition']
	SessionInfo: SessionInfo
	SetProjectSecretError: SetProjectSecretError
	SetProjectSecretResponse: SetProjectSecretResponse
	SignInError: SignInError
	SignInIDPError: SignInIdpError
	SignInIDPResponse: SignInIdpResponse
	SignInIDPResult: SignInIdpResult
	SignInOptions: SignInOptions
	SignInPasswordlessError: SignInPasswordlessError
	SignInPasswordlessResponse: SignInPasswordlessResponse
	SignInPasswordlessResult: SignInPasswordlessResult
	SignInResponse: SignInResponse
	SignInResult: SignInResult
	SignOutError: SignOutError
	SignOutResponse: SignOutResponse
	SignUpError: SignUpError
	SignUpResponse: SignUpResponse
	SignUpResult: SignUpResult
	String: Scalars['String']['output']
	ToggleMyPasswordlessError: ToggleMyPasswordlessError
	ToggleMyPasswordlessResponse: ToggleMyPasswordlessResponse
	UnmanagedInviteOptions: UnmanagedInviteOptions
	UpdateAuthPolicyError: UpdateAuthPolicyError
	UpdateAuthPolicyResponse: UpdateAuthPolicyResponse
	UpdateCustomRoleError: UpdateCustomRoleError
	UpdateCustomRoleResponse: UpdateCustomRoleResponse
	UpdateIDPError: UpdateIdpError
	UpdateIDPResponse: UpdateIdpResponse
	UpdateProjectError: UpdateProjectError
	UpdateProjectMemberError: UpdateProjectMemberError
	UpdateProjectMemberResponse: UpdateProjectMemberResponse
	UpdateProjectResponse: UpdateProjectResponse
	VariableEntry: VariableEntry
	VariableEntryInput: VariableEntryInput
	VerifyEmailError: VerifyEmailError
	VerifyEmailResponse: VerifyEmailResponse
}

export type ActivatePasswordlessOtpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ActivatePasswordlessOtpError'] = ResolversParentTypes['ActivatePasswordlessOtpError'],
> = {
	code?: Resolver<ResolversTypes['ActivatePasswordlessOtpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ActivatePasswordlessOtpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ActivatePasswordlessOtpResponse'] = ResolversParentTypes['ActivatePasswordlessOtpResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ActivatePasswordlessOtpError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type AddGlobalIdentityRolesErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddGlobalIdentityRolesError'] = ResolversParentTypes['AddGlobalIdentityRolesError'],
> = {
	code?: Resolver<ResolversTypes['AddGlobalIdentityRolesErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type AddGlobalIdentityRolesResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddGlobalIdentityRolesResponse'] = ResolversParentTypes['AddGlobalIdentityRolesResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['AddGlobalIdentityRolesError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['AddGlobalIdentityRolesResult']>, ParentType, ContextType>
}

export type AddGlobalIdentityRolesResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddGlobalIdentityRolesResult'] = ResolversParentTypes['AddGlobalIdentityRolesResult'],
> = {
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
}

export type AddIdpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['AddIDPError'] = ResolversParentTypes['AddIDPError']> = {
	code?: Resolver<ResolversTypes['AddIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type AddIdpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddIDPResponse'] = ResolversParentTypes['AddIDPResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['AddIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type AddMailTemplateErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddMailTemplateError'] = ResolversParentTypes['AddMailTemplateError'],
> = {
	code?: Resolver<ResolversTypes['AddMailTemplateErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type AddMailTemplateResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddMailTemplateResponse'] = ResolversParentTypes['AddMailTemplateResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['AddMailTemplateError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['AddMailTemplateError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type AddProjectMemberErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddProjectMemberError'] = ResolversParentTypes['AddProjectMemberError'],
> = {
	code?: Resolver<ResolversTypes['AddProjectMemberErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	membershipValidation?: Resolver<Maybe<ReadonlyArray<ResolversTypes['MembershipValidationError']>>, ParentType, ContextType>
}

export type AddProjectMemberResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['AddProjectMemberResponse'] = ResolversParentTypes['AddProjectMemberResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['AddProjectMemberError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['AddProjectMemberError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ApiKeyResolvers<ContextType = any, ParentType extends ResolversParentTypes['ApiKey'] = ResolversParentTypes['ApiKey']> = {
	createdAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	enabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>
	expiresAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	lastUsedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	type?: Resolver<Maybe<ResolversTypes['ApiKeyType']>, ParentType, ContextType>
}

export type ApiKeyWithTokenResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ApiKeyWithToken'] = ResolversParentTypes['ApiKeyWithToken'],
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	token?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type AuthLogEntryResolvers<ContextType = any, ParentType extends ResolversParentTypes['AuthLogEntry'] = ResolversParentTypes['AuthLogEntry']> =
	{
		createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
		errorCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
		errorMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
		eventData?: Resolver<Maybe<ResolversTypes['Json']>, ParentType, ContextType>
		id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
		identityProviderId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
		invokedByIdentityId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
		ipAddress?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
		metadata?: Resolver<Maybe<ResolversTypes['Json']>, ParentType, ContextType>
		personId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
		personInputIdentifier?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
		success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
		targetPersonId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
		type?: Resolver<ResolversTypes['String'], ParentType, ContextType>
		userAgent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	}

export type AuthLogPageResolvers<ContextType = any, ParentType extends ResolversParentTypes['AuthLogPage'] = ResolversParentTypes['AuthLogPage']> = {
	entries?: Resolver<ReadonlyArray<ResolversTypes['AuthLogEntry']>, ParentType, ContextType>
	hasMore?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type AuthPolicyResolvers<ContextType = any, ParentType extends ResolversParentTypes['AuthPolicy'] = ResolversParentTypes['AuthPolicy']> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	idleTimeout?: Resolver<Maybe<ResolversTypes['Interval']>, ParentType, ContextType>
	mfaGraceDuration?: Resolver<Maybe<ResolversTypes['Interval']>, ParentType, ContextType>
	mfaRequired?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>
	project?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	rememberMeAllowed?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>
	roles?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
	scope?: Resolver<ResolversTypes['AuthPolicyScope'], ParentType, ContextType>
	tokenExpiration?: Resolver<Maybe<ResolversTypes['Interval']>, ParentType, ContextType>
}

export type ChangeMyPasswordErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChangeMyPasswordError'] = ResolversParentTypes['ChangeMyPasswordError'],
> = {
	code?: Resolver<ResolversTypes['ChangeMyPasswordErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	weakPasswordReasons?: Resolver<Maybe<ReadonlyArray<ResolversTypes['WeakPasswordReason']>>, ParentType, ContextType>
}

export type ChangeMyPasswordResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChangeMyPasswordResponse'] = ResolversParentTypes['ChangeMyPasswordResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ChangeMyPasswordError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ChangeMyProfileErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChangeMyProfileError'] = ResolversParentTypes['ChangeMyProfileError'],
> = {
	code?: Resolver<ResolversTypes['ChangeMyProfileErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ChangeMyProfileResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChangeMyProfileResponse'] = ResolversParentTypes['ChangeMyProfileResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ChangeMyProfileError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ChangePasswordErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChangePasswordError'] = ResolversParentTypes['ChangePasswordError'],
> = {
	code?: Resolver<ResolversTypes['ChangePasswordErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	weakPasswordReasons?: Resolver<Maybe<ReadonlyArray<ResolversTypes['WeakPasswordReason']>>, ParentType, ContextType>
}

export type ChangePasswordResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChangePasswordResponse'] = ResolversParentTypes['ChangePasswordResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ChangePasswordError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ChangePasswordError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ChangeProfileErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChangeProfileError'] = ResolversParentTypes['ChangeProfileError'],
> = {
	code?: Resolver<ResolversTypes['ChangeProfileErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ChangeProfileResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ChangeProfileResponse'] = ResolversParentTypes['ChangeProfileResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ChangeProfileError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type CheckResetPasswordTokenResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CheckResetPasswordTokenResult'] = ResolversParentTypes['CheckResetPasswordTokenResult'],
> = {
	code?: Resolver<ResolversTypes['CheckResetPasswordTokenCode'], ParentType, ContextType>
}

export type CommonSignInResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CommonSignInResult'] = ResolversParentTypes['CommonSignInResult'],
> = {
	__resolveType: TypeResolveFn<'CreateSessionTokenResult' | 'SignInIDPResult' | 'SignInPasswordlessResult' | 'SignInResult', ParentType, ContextType>
}

export type ConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['Config'] = ResolversParentTypes['Config']> = {
	captcha?: Resolver<ResolversTypes['ConfigCaptcha'], ParentType, ContextType>
	emailChange?: Resolver<ResolversTypes['ConfigEmailChange'], ParentType, ContextType>
	login?: Resolver<ResolversTypes['ConfigLogin'], ParentType, ContextType>
	password?: Resolver<ResolversTypes['ConfigPassword'], ParentType, ContextType>
	passwordless?: Resolver<ResolversTypes['ConfigPasswordless'], ParentType, ContextType>
	rateLimits?: Resolver<ResolversTypes['ConfigRateLimits'], ParentType, ContextType>
	signup?: Resolver<ResolversTypes['ConfigSignup'], ParentType, ContextType>
}

export type ConfigCaptchaResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfigCaptcha'] = ResolversParentTypes['ConfigCaptcha'],
> = {
	protect?: Resolver<ResolversTypes['ConfigCaptchaProtect'], ParentType, ContextType>
	provider?: Resolver<Maybe<ResolversTypes['CaptchaProvider']>, ParentType, ContextType>
	threshold?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>
}

export type ConfigCaptchaProtectResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfigCaptchaProtect'] = ResolversParentTypes['ConfigCaptchaProtect'],
> = {
	emailVerification?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	passwordReset?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	passwordlessInit?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	signUp?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ConfigEmailChangeResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfigEmailChange'] = ResolversParentTypes['ConfigEmailChange'],
> = {
	requireVerification?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ConfigLoginResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConfigLogin'] = ResolversParentTypes['ConfigLogin']> = {
	anomalyDetection?: Resolver<ResolversTypes['ConfigLoginAnomalyDetection'], ParentType, ContextType>
	attemptWindow?: Resolver<ResolversTypes['Interval'], ParentType, ContextType>
	baseBackoff?: Resolver<ResolversTypes['Interval'], ParentType, ContextType>
	defaultTokenExpiration?: Resolver<ResolversTypes['Interval'], ParentType, ContextType>
	maxBackoff?: Resolver<ResolversTypes['Interval'], ParentType, ContextType>
	maxTokenExpiration?: Resolver<Maybe<ResolversTypes['Interval']>, ParentType, ContextType>
	mfaGraceDuration?: Resolver<ResolversTypes['Interval'], ParentType, ContextType>
	revealLoginMethod?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	revealUserExists?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ConfigLoginAnomalyDetectionResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfigLoginAnomalyDetection'] = ResolversParentTypes['ConfigLoginAnomalyDetection'],
> = {
	emailThreshold?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	enabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	historySize?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	stepUpThreshold?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
}

export type ConfigPasswordResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfigPassword'] = ResolversParentTypes['ConfigPassword'],
> = {
	checkBlacklist?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	checkHibp?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	minLength?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	pattern?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	requireDigit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	requireLowercase?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	requireSpecial?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	requireUppercase?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
}

export type ConfigPasswordlessResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfigPasswordless'] = ResolversParentTypes['ConfigPasswordless'],
> = {
	enabled?: Resolver<ResolversTypes['ConfigPolicy'], ParentType, ContextType>
	expiration?: Resolver<ResolversTypes['Interval'], ParentType, ContextType>
	url?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type ConfigRateLimitWindowResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfigRateLimitWindow'] = ResolversParentTypes['ConfigRateLimitWindow'],
> = {
	limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>
	window?: Resolver<ResolversTypes['Interval'], ParentType, ContextType>
}

export type ConfigRateLimitsResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfigRateLimits'] = ResolversParentTypes['ConfigRateLimits'],
> = {
	emailOtpPerPerson?: Resolver<ResolversTypes['ConfigRateLimitWindow'], ParentType, ContextType>
	emailVerificationPerIp?: Resolver<ResolversTypes['ConfigRateLimitWindow'], ParentType, ContextType>
	loginPerIp?: Resolver<ResolversTypes['ConfigRateLimitWindow'], ParentType, ContextType>
	passwordResetPerIp?: Resolver<ResolversTypes['ConfigRateLimitWindow'], ParentType, ContextType>
	passwordlessInitPerIp?: Resolver<ResolversTypes['ConfigRateLimitWindow'], ParentType, ContextType>
	signUpPerIp?: Resolver<ResolversTypes['ConfigRateLimitWindow'], ParentType, ContextType>
}

export type ConfigSignupResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConfigSignup'] = ResolversParentTypes['ConfigSignup']> =
	{
		requireEmailVerification?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	}

export type ConfigureErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfigureError'] = ResolversParentTypes['ConfigureError'],
> = {
	code?: Resolver<ResolversTypes['ConfigureErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ConfigureResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfigureResponse'] = ResolversParentTypes['ConfigureResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ConfigureError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ConfirmEmailChangeErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfirmEmailChangeError'] = ResolversParentTypes['ConfirmEmailChangeError'],
> = {
	code?: Resolver<ResolversTypes['ConfirmEmailChangeErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ConfirmEmailChangeResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfirmEmailChangeResponse'] = ResolversParentTypes['ConfirmEmailChangeResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ConfirmEmailChangeError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ConfirmEmailOtpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfirmEmailOtpError'] = ResolversParentTypes['ConfirmEmailOtpError'],
> = {
	code?: Resolver<ResolversTypes['ConfirmEmailOtpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ConfirmEmailOtpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfirmEmailOtpResponse'] = ResolversParentTypes['ConfirmEmailOtpResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ConfirmEmailOtpError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['ConfirmEmailOtpResult']>, ParentType, ContextType>
}

export type ConfirmEmailOtpResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfirmEmailOtpResult'] = ResolversParentTypes['ConfirmEmailOtpResult'],
> = {
	backupCodes?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
}

export type ConfirmOtpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfirmOtpError'] = ResolversParentTypes['ConfirmOtpError'],
> = {
	code?: Resolver<ResolversTypes['ConfirmOtpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type ConfirmOtpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfirmOtpResponse'] = ResolversParentTypes['ConfirmOtpResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ConfirmOtpError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ConfirmOtpError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['ConfirmOtpResult']>, ParentType, ContextType>
}

export type ConfirmOtpResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ConfirmOtpResult'] = ResolversParentTypes['ConfirmOtpResult'],
> = {
	backupCodes?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
}

export type CreateApiKeyErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateApiKeyError'] = ResolversParentTypes['CreateApiKeyError'],
> = {
	code?: Resolver<ResolversTypes['CreateApiKeyErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	membershipValidation?: Resolver<Maybe<ReadonlyArray<ResolversTypes['MembershipValidationError']>>, ParentType, ContextType>
}

export type CreateApiKeyResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateApiKeyResponse'] = ResolversParentTypes['CreateApiKeyResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['CreateApiKeyError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['CreateApiKeyError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['CreateApiKeyResult']>, ParentType, ContextType>
}

export type CreateApiKeyResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateApiKeyResult'] = ResolversParentTypes['CreateApiKeyResult'],
> = {
	apiKey?: Resolver<ResolversTypes['ApiKeyWithToken'], ParentType, ContextType>
}

export type CreateAuthPolicyErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateAuthPolicyError'] = ResolversParentTypes['CreateAuthPolicyError'],
> = {
	code?: Resolver<ResolversTypes['CreateAuthPolicyErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type CreateAuthPolicyResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateAuthPolicyResponse'] = ResolversParentTypes['CreateAuthPolicyResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['CreateAuthPolicyError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['CreateAuthPolicyResult']>, ParentType, ContextType>
}

export type CreateAuthPolicyResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateAuthPolicyResult'] = ResolversParentTypes['CreateAuthPolicyResult'],
> = {
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type CreateCustomRoleErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateCustomRoleError'] = ResolversParentTypes['CreateCustomRoleError'],
> = {
	code?: Resolver<ResolversTypes['CreateCustomRoleErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type CreateCustomRoleResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateCustomRoleResponse'] = ResolversParentTypes['CreateCustomRoleResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['CreateCustomRoleError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type CreatePasswordResetRequestErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreatePasswordResetRequestError'] = ResolversParentTypes['CreatePasswordResetRequestError'],
> = {
	code?: Resolver<ResolversTypes['CreatePasswordResetRequestErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type CreatePasswordResetRequestResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreatePasswordResetRequestResponse'] = ResolversParentTypes['CreatePasswordResetRequestResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['CreatePasswordResetRequestError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['CreatePasswordResetRequestError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type CreateProjectResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateProjectResponse'] = ResolversParentTypes['CreateProjectResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['CreateProjectResponseError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['CreateProjectResult']>, ParentType, ContextType>
}

export type CreateProjectResponseErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateProjectResponseError'] = ResolversParentTypes['CreateProjectResponseError'],
> = {
	code?: Resolver<ResolversTypes['CreateProjectResponseErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type CreateProjectResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateProjectResult'] = ResolversParentTypes['CreateProjectResult'],
> = {
	deployerApiKey?: Resolver<Maybe<ResolversTypes['ApiKeyWithToken']>, ParentType, ContextType>
}

export type CreateSessionTokenErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateSessionTokenError'] = ResolversParentTypes['CreateSessionTokenError'],
> = {
	code?: Resolver<ResolversTypes['CreateSessionTokenErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type CreateSessionTokenResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateSessionTokenResponse'] = ResolversParentTypes['CreateSessionTokenResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['CreateSessionTokenError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['CreateSessionTokenResult']>, ParentType, ContextType>
}

export type CreateSessionTokenResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CreateSessionTokenResult'] = ResolversParentTypes['CreateSessionTokenResult'],
> = {
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type CustomRoleResolvers<ContextType = any, ParentType extends ResolversParentTypes['CustomRole'] = ResolversParentTypes['CustomRole']> = {
	description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	grants?: Resolver<ReadonlyArray<ResolversTypes['CustomRoleGrant']>, ParentType, ContextType>
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type CustomRoleGrantResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CustomRoleGrant'] = ResolversParentTypes['CustomRoleGrant'],
> = {
	config?: Resolver<Maybe<ResolversTypes['Json']>, ParentType, ContextType>
	permission?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type CustomRolePermissionDefinitionResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['CustomRolePermissionDefinition'] = ResolversParentTypes['CustomRolePermissionDefinition'],
> = {
	configurationKind?: Resolver<ResolversTypes['CustomRoleConfigurationKind'], ParentType, ContextType>
	configurationRequired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	defaultConfig?: Resolver<Maybe<ResolversTypes['Json']>, ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
	name: 'DateTime'
}

export type DeleteAuthPolicyErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DeleteAuthPolicyError'] = ResolversParentTypes['DeleteAuthPolicyError'],
> = {
	code?: Resolver<ResolversTypes['DeleteAuthPolicyErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type DeleteAuthPolicyResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DeleteAuthPolicyResponse'] = ResolversParentTypes['DeleteAuthPolicyResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['DeleteAuthPolicyError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type DeleteCustomRoleErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DeleteCustomRoleError'] = ResolversParentTypes['DeleteCustomRoleError'],
> = {
	code?: Resolver<ResolversTypes['DeleteCustomRoleErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type DeleteCustomRoleResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DeleteCustomRoleResponse'] = ResolversParentTypes['DeleteCustomRoleResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['DeleteCustomRoleError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type DisableApiKeyErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableApiKeyError'] = ResolversParentTypes['DisableApiKeyError'],
> = {
	code?: Resolver<ResolversTypes['DisableApiKeyErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type DisableApiKeyResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableApiKeyResponse'] = ResolversParentTypes['DisableApiKeyResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['DisableApiKeyError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['DisableApiKeyError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type DisableEmailOtpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableEmailOtpError'] = ResolversParentTypes['DisableEmailOtpError'],
> = {
	code?: Resolver<ResolversTypes['DisableEmailOtpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type DisableEmailOtpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableEmailOtpResponse'] = ResolversParentTypes['DisableEmailOtpResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['DisableEmailOtpError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type DisableIdpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableIDPError'] = ResolversParentTypes['DisableIDPError'],
> = {
	code?: Resolver<ResolversTypes['DisableIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type DisableIdpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableIDPResponse'] = ResolversParentTypes['DisableIDPResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['DisableIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type DisableOtpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableOtpError'] = ResolversParentTypes['DisableOtpError'],
> = {
	code?: Resolver<ResolversTypes['DisableOtpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type DisableOtpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisableOtpResponse'] = ResolversParentTypes['DisableOtpResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['DisableOtpError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['DisableOtpError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type DisablePersonErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisablePersonError'] = ResolversParentTypes['DisablePersonError'],
> = {
	code?: Resolver<ResolversTypes['DisablePersonErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type DisablePersonResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisablePersonResponse'] = ResolversParentTypes['DisablePersonResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['DisablePersonError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type DisconnectIdpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisconnectIDPError'] = ResolversParentTypes['DisconnectIDPError'],
> = {
	code?: Resolver<ResolversTypes['DisconnectIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type DisconnectIdpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['DisconnectIDPResponse'] = ResolversParentTypes['DisconnectIDPResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['DisconnectIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type EnableIdpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['EnableIDPError'] = ResolversParentTypes['EnableIDPError'],
> = {
	code?: Resolver<ResolversTypes['EnableIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type EnableIdpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['EnableIDPResponse'] = ResolversParentTypes['EnableIDPResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['EnableIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ForceSignOutPersonErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ForceSignOutPersonError'] = ResolversParentTypes['ForceSignOutPersonError'],
> = {
	code?: Resolver<ResolversTypes['ForceSignOutPersonErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ForceSignOutPersonResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ForceSignOutPersonResponse'] = ResolversParentTypes['ForceSignOutPersonResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ForceSignOutPersonError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type IdpOptionsOutputResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['IDPOptionsOutput'] = ResolversParentTypes['IDPOptionsOutput'],
> = {
	assumeEmailVerified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	autoSignUp?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	exclusive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	initReturnsConfig?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	requireVerifiedEmail?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type IdentityResolvers<ContextType = any, ParentType extends ResolversParentTypes['Identity'] = ResolversParentTypes['Identity']> = {
	apiKey?: Resolver<Maybe<ResolversTypes['ApiKey']>, ParentType, ContextType>
	description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	permissions?: Resolver<Maybe<ResolversTypes['IdentityGlobalPermissions']>, ParentType, ContextType>
	person?: Resolver<Maybe<ResolversTypes['Person']>, ParentType, ContextType>
	projects?: Resolver<ReadonlyArray<ResolversTypes['IdentityProjectRelation']>, ParentType, ContextType>
	roles?: Resolver<Maybe<ReadonlyArray<ResolversTypes['String']>>, ParentType, ContextType>
	sessions?: Resolver<ReadonlyArray<ResolversTypes['SessionInfo']>, ParentType, ContextType>
}

export type IdentityGlobalPermissionsResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['IdentityGlobalPermissions'] = ResolversParentTypes['IdentityGlobalPermissions'],
> = {
	canCreateProject?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	canDeployEntrypoint?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type IdentityProjectRelationResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['IdentityProjectRelation'] = ResolversParentTypes['IdentityProjectRelation'],
> = {
	memberships?: Resolver<ReadonlyArray<ResolversTypes['Membership']>, ParentType, ContextType>
	project?: Resolver<ResolversTypes['Project'], ParentType, ContextType>
}

export type IdentityProviderResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['IdentityProvider'] = ResolversParentTypes['IdentityProvider'],
> = {
	configuration?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	disabledAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	options?: Resolver<ResolversTypes['IDPOptionsOutput'], ParentType, ContextType>
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type IdentityProviderListItemResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['IdentityProviderListItem'] = ResolversParentTypes['IdentityProviderListItem'],
> = {
	disabledAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type InitEmailOtpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['InitEmailOtpError'] = ResolversParentTypes['InitEmailOtpError'],
> = {
	code?: Resolver<ResolversTypes['InitEmailOtpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type InitEmailOtpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['InitEmailOtpResponse'] = ResolversParentTypes['InitEmailOtpResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['InitEmailOtpError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type InitSignInIdpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['InitSignInIDPError'] = ResolversParentTypes['InitSignInIDPError'],
> = {
	code?: Resolver<ResolversTypes['InitSignInIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type InitSignInIdpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['InitSignInIDPResponse'] = ResolversParentTypes['InitSignInIDPResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['InitSignInIDPError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['InitSignInIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['InitSignInIDPResult']>, ParentType, ContextType>
}

export type InitSignInIdpResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['InitSignInIDPResult'] = ResolversParentTypes['InitSignInIDPResult'],
> = {
	authUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	idpConfiguration?: Resolver<Maybe<ResolversTypes['Json']>, ParentType, ContextType>
	sessionData?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
}

export type InitSignInPasswordlessErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['InitSignInPasswordlessError'] = ResolversParentTypes['InitSignInPasswordlessError'],
> = {
	code?: Resolver<ResolversTypes['InitSignInPasswordlessErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type InitSignInPasswordlessResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['InitSignInPasswordlessResponse'] = ResolversParentTypes['InitSignInPasswordlessResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['InitSignInPasswordlessError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['InitSignInPasswordlessResult']>, ParentType, ContextType>
}

export type InitSignInPasswordlessResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['InitSignInPasswordlessResult'] = ResolversParentTypes['InitSignInPasswordlessResult'],
> = {
	expiresAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	requestId?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export interface IntervalScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Interval'], any> {
	name: 'Interval'
}

export type InviteErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['InviteError'] = ResolversParentTypes['InviteError']> = {
	code?: Resolver<ResolversTypes['InviteErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	membershipValidation?: Resolver<Maybe<ReadonlyArray<ResolversTypes['MembershipValidationError']>>, ParentType, ContextType>
}

export type InviteResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['InviteResponse'] = ResolversParentTypes['InviteResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['InviteError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['InviteError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['InviteResult']>, ParentType, ContextType>
}

export type InviteResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['InviteResult'] = ResolversParentTypes['InviteResult']> =
	{
		isNew?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
		person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	}

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Json'], any> {
	name: 'Json'
}

export type MailTemplateDataResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['MailTemplateData'] = ResolversParentTypes['MailTemplateData'],
> = {
	content?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	projectSlug?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	replyTo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	subject?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	type?: Resolver<ResolversTypes['MailType'], ParentType, ContextType>
	useLayout?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	variant?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type MembershipResolvers<ContextType = any, ParentType extends ResolversParentTypes['Membership'] = ResolversParentTypes['Membership']> = {
	role?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	variables?: Resolver<ReadonlyArray<ResolversTypes['VariableEntry']>, ParentType, ContextType>
}

export type MembershipValidationErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['MembershipValidationError'] = ResolversParentTypes['MembershipValidationError'],
> = {
	code?: Resolver<ResolversTypes['MembershipValidationErrorCode'], ParentType, ContextType>
	role?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	variable?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type MfaEnrollmentResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['MfaEnrollment'] = ResolversParentTypes['MfaEnrollment'],
> = {
	otpSecret?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	otpUri?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
	activatePasswordlessOtp?: Resolver<
		Maybe<ResolversTypes['ActivatePasswordlessOtpResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationActivatePasswordlessOtpArgs, 'otpHash' | 'requestId' | 'token'>
	>
	addGlobalIdentityRoles?: Resolver<
		Maybe<ResolversTypes['AddGlobalIdentityRolesResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationAddGlobalIdentityRolesArgs, 'identityId' | 'roles'>
	>
	addIDP?: Resolver<
		Maybe<ResolversTypes['AddIDPResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationAddIdpArgs, 'configuration' | 'identityProvider' | 'type'>
	>
	addMailTemplate?: Resolver<
		Maybe<ResolversTypes['AddMailTemplateResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationAddMailTemplateArgs, 'template'>
	>
	addProjectMailTemplate?: Resolver<
		Maybe<ResolversTypes['AddMailTemplateResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationAddProjectMailTemplateArgs, 'template'>
	>
	addProjectMember?: Resolver<
		Maybe<ResolversTypes['AddProjectMemberResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationAddProjectMemberArgs, 'identityId' | 'memberships' | 'projectSlug'>
	>
	changeMyPassword?: Resolver<
		Maybe<ResolversTypes['ChangeMyPasswordResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationChangeMyPasswordArgs, 'currentPassword' | 'newPassword'>
	>
	changeMyProfile?: Resolver<Maybe<ResolversTypes['ChangeMyProfileResponse']>, ParentType, ContextType, Partial<MutationChangeMyProfileArgs>>
	changePassword?: Resolver<
		Maybe<ResolversTypes['ChangePasswordResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationChangePasswordArgs, 'password' | 'personId'>
	>
	changeProfile?: Resolver<
		Maybe<ResolversTypes['ChangeProfileResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationChangeProfileArgs, 'personId'>
	>
	configure?: Resolver<Maybe<ResolversTypes['ConfigureResponse']>, ParentType, ContextType, RequireFields<MutationConfigureArgs, 'config'>>
	confirmEmailChange?: Resolver<
		Maybe<ResolversTypes['ConfirmEmailChangeResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationConfirmEmailChangeArgs, 'token'>
	>
	confirmEmailOtp?: Resolver<
		Maybe<ResolversTypes['ConfirmEmailOtpResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationConfirmEmailOtpArgs, 'otpToken'>
	>
	confirmOtp?: Resolver<Maybe<ResolversTypes['ConfirmOtpResponse']>, ParentType, ContextType, RequireFields<MutationConfirmOtpArgs, 'otpToken'>>
	createApiKey?: Resolver<
		Maybe<ResolversTypes['CreateApiKeyResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationCreateApiKeyArgs, 'description' | 'memberships' | 'projectSlug'>
	>
	createAuthPolicy?: Resolver<
		Maybe<ResolversTypes['CreateAuthPolicyResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationCreateAuthPolicyArgs, 'policy'>
	>
	createCustomRole?: Resolver<
		Maybe<ResolversTypes['CreateCustomRoleResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationCreateCustomRoleArgs, 'grants' | 'slug'>
	>
	createGlobalApiKey?: Resolver<
		Maybe<ResolversTypes['CreateApiKeyResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationCreateGlobalApiKeyArgs, 'description'>
	>
	createProject?: Resolver<
		Maybe<ResolversTypes['CreateProjectResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationCreateProjectArgs, 'projectSlug'>
	>
	createResetPasswordRequest?: Resolver<
		Maybe<ResolversTypes['CreatePasswordResetRequestResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationCreateResetPasswordRequestArgs, 'email'>
	>
	createSessionToken?: Resolver<Maybe<ResolversTypes['CreateSessionTokenResponse']>, ParentType, ContextType, Partial<MutationCreateSessionTokenArgs>>
	deleteAuthPolicy?: Resolver<
		Maybe<ResolversTypes['DeleteAuthPolicyResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationDeleteAuthPolicyArgs, 'id'>
	>
	deleteCustomRole?: Resolver<
		Maybe<ResolversTypes['DeleteCustomRoleResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationDeleteCustomRoleArgs, 'slug'>
	>
	disableApiKey?: Resolver<Maybe<ResolversTypes['DisableApiKeyResponse']>, ParentType, ContextType, RequireFields<MutationDisableApiKeyArgs, 'id'>>
	disableEmailOtp?: Resolver<Maybe<ResolversTypes['DisableEmailOtpResponse']>, ParentType, ContextType>
	disableIDP?: Resolver<
		Maybe<ResolversTypes['DisableIDPResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationDisableIdpArgs, 'identityProvider'>
	>
	disableMyPasswordless?: Resolver<Maybe<ResolversTypes['ToggleMyPasswordlessResponse']>, ParentType, ContextType>
	disableOtp?: Resolver<Maybe<ResolversTypes['DisableOtpResponse']>, ParentType, ContextType>
	disablePerson?: Resolver<
		Maybe<ResolversTypes['DisablePersonResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationDisablePersonArgs, 'personId'>
	>
	disconnectMyIdentityProvider?: Resolver<
		Maybe<ResolversTypes['DisconnectIDPResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationDisconnectMyIdentityProviderArgs, 'id'>
	>
	enableIDP?: Resolver<Maybe<ResolversTypes['EnableIDPResponse']>, ParentType, ContextType, RequireFields<MutationEnableIdpArgs, 'identityProvider'>>
	enableMyPasswordless?: Resolver<Maybe<ResolversTypes['ToggleMyPasswordlessResponse']>, ParentType, ContextType>
	forceSignOutPerson?: Resolver<
		Maybe<ResolversTypes['ForceSignOutPersonResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationForceSignOutPersonArgs, 'personId'>
	>
	initEmailOtp?: Resolver<Maybe<ResolversTypes['InitEmailOtpResponse']>, ParentType, ContextType>
	initSignInIDP?: Resolver<
		Maybe<ResolversTypes['InitSignInIDPResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationInitSignInIdpArgs, 'identityProvider'>
	>
	initSignInPasswordless?: Resolver<
		Maybe<ResolversTypes['InitSignInPasswordlessResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationInitSignInPasswordlessArgs, 'email'>
	>
	invite?: Resolver<
		Maybe<ResolversTypes['InviteResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationInviteArgs, 'email' | 'memberships' | 'projectSlug'>
	>
	prepareOtp?: Resolver<Maybe<ResolversTypes['PrepareOtpResponse']>, ParentType, ContextType, Partial<MutationPrepareOtpArgs>>
	regenerateBackupCodes?: Resolver<Maybe<ResolversTypes['RegenerateBackupCodesResponse']>, ParentType, ContextType>
	removeGlobalIdentityRoles?: Resolver<
		Maybe<ResolversTypes['RemoveGlobalIdentityRolesResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationRemoveGlobalIdentityRolesArgs, 'identityId' | 'roles'>
	>
	removeMailTemplate?: Resolver<
		Maybe<ResolversTypes['RemoveMailTemplateResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationRemoveMailTemplateArgs, 'templateIdentifier'>
	>
	removeProjectMailTemplate?: Resolver<
		Maybe<ResolversTypes['RemoveMailTemplateResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationRemoveProjectMailTemplateArgs, 'templateIdentifier'>
	>
	removeProjectMember?: Resolver<
		Maybe<ResolversTypes['RemoveProjectMemberResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationRemoveProjectMemberArgs, 'identityId' | 'projectSlug'>
	>
	requestEmailVerification?: Resolver<
		Maybe<ResolversTypes['RequestEmailVerificationResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationRequestEmailVerificationArgs, 'email'>
	>
	resetPassword?: Resolver<
		Maybe<ResolversTypes['ResetPasswordResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationResetPasswordArgs, 'password' | 'token'>
	>
	resetPersonMfa?: Resolver<
		Maybe<ResolversTypes['ResetPersonMfaResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationResetPersonMfaArgs, 'personId'>
	>
	revokeSession?: Resolver<
		Maybe<ResolversTypes['RevokeSessionResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationRevokeSessionArgs, 'sessionId'>
	>
	setProjectSecret?: Resolver<
		Maybe<ResolversTypes['SetProjectSecretResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationSetProjectSecretArgs, 'key' | 'projectSlug' | 'value'>
	>
	signIn?: Resolver<Maybe<ResolversTypes['SignInResponse']>, ParentType, ContextType, RequireFields<MutationSignInArgs, 'email' | 'password'>>
	signInIDP?: Resolver<Maybe<ResolversTypes['SignInIDPResponse']>, ParentType, ContextType, RequireFields<MutationSignInIdpArgs, 'identityProvider'>>
	signInPasswordless?: Resolver<
		Maybe<ResolversTypes['SignInPasswordlessResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationSignInPasswordlessArgs, 'requestId' | 'token' | 'validationType'>
	>
	signOut?: Resolver<Maybe<ResolversTypes['SignOutResponse']>, ParentType, ContextType, Partial<MutationSignOutArgs>>
	signUp?: Resolver<Maybe<ResolversTypes['SignUpResponse']>, ParentType, ContextType, RequireFields<MutationSignUpArgs, 'email'>>
	unmanagedInvite?: Resolver<
		Maybe<ResolversTypes['InviteResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationUnmanagedInviteArgs, 'email' | 'memberships' | 'projectSlug'>
	>
	updateAuthPolicy?: Resolver<
		Maybe<ResolversTypes['UpdateAuthPolicyResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationUpdateAuthPolicyArgs, 'id' | 'policy'>
	>
	updateCustomRole?: Resolver<
		Maybe<ResolversTypes['UpdateCustomRoleResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationUpdateCustomRoleArgs, 'slug'>
	>
	updateIDP?: Resolver<Maybe<ResolversTypes['UpdateIDPResponse']>, ParentType, ContextType, RequireFields<MutationUpdateIdpArgs, 'identityProvider'>>
	updateProject?: Resolver<
		Maybe<ResolversTypes['UpdateProjectResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationUpdateProjectArgs, 'projectSlug'>
	>
	updateProjectMember?: Resolver<
		Maybe<ResolversTypes['UpdateProjectMemberResponse']>,
		ParentType,
		ContextType,
		RequireFields<MutationUpdateProjectMemberArgs, 'identityId' | 'memberships' | 'projectSlug'>
	>
	verifyEmail?: Resolver<Maybe<ResolversTypes['VerifyEmailResponse']>, ParentType, ContextType, RequireFields<MutationVerifyEmailArgs, 'token'>>
}

export type PersonResolvers<ContextType = any, ParentType extends ResolversParentTypes['Person'] = ResolversParentTypes['Person']> = {
	email?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	emailOtpEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	emailVerified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	identityProviders?: Resolver<ReadonlyArray<ResolversTypes['PersonIdentityProvider']>, ParentType, ContextType>
	name?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	otpEnabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	passwordlessEnabled?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>
}

export type PersonIdentityProviderResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['PersonIdentityProvider'] = ResolversParentTypes['PersonIdentityProvider'],
> = {
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	externalIdentifier?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	identityProvider?: Resolver<ResolversTypes['IdentityProviderListItem'], ParentType, ContextType>
}

export type PrepareOtpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['PrepareOtpResponse'] = ResolversParentTypes['PrepareOtpResponse'],
> = {
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['PrepareOtpResult']>, ParentType, ContextType>
}

export type PrepareOtpResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['PrepareOtpResult'] = ResolversParentTypes['PrepareOtpResult'],
> = {
	otpSecret?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	otpUri?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ProjectResolvers<ContextType = any, ParentType extends ResolversParentTypes['Project'] = ResolversParentTypes['Project']> = {
	apiKeys?: Resolver<ReadonlyArray<ResolversTypes['ApiKey']>, ParentType, ContextType>
	config?: Resolver<ResolversTypes['Json'], ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	members?: Resolver<ReadonlyArray<ResolversTypes['ProjectIdentityRelation']>, ParentType, ContextType, Partial<ProjectMembersArgs>>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	roles?: Resolver<ReadonlyArray<ResolversTypes['RoleDefinition']>, ParentType, ContextType>
	secrets?: Resolver<ReadonlyArray<ResolversTypes['ProjectSecretInfo']>, ParentType, ContextType>
	slug?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ProjectIdentityRelationResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ProjectIdentityRelation'] = ResolversParentTypes['ProjectIdentityRelation'],
> = {
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	memberships?: Resolver<ReadonlyArray<ResolversTypes['Membership']>, ParentType, ContextType>
}

export type ProjectSecretInfoResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ProjectSecretInfo'] = ResolversParentTypes['ProjectSecretInfo'],
> = {
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	key?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
}

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
	authLog?: Resolver<ResolversTypes['AuthLogPage'], ParentType, ContextType, Partial<QueryAuthLogArgs>>
	authPolicies?: Resolver<ReadonlyArray<ResolversTypes['AuthPolicy']>, ParentType, ContextType>
	checkResetPasswordToken?: Resolver<
		ResolversTypes['CheckResetPasswordTokenCode'],
		ParentType,
		ContextType,
		RequireFields<QueryCheckResetPasswordTokenArgs, 'requestId' | 'token'>
	>
	configuration?: Resolver<ResolversTypes['Config'], ParentType, ContextType>
	customRolePermissions?: Resolver<ReadonlyArray<ResolversTypes['CustomRolePermissionDefinition']>, ParentType, ContextType>
	customRoles?: Resolver<ReadonlyArray<ResolversTypes['CustomRole']>, ParentType, ContextType>
	globalApiKeys?: Resolver<ReadonlyArray<ResolversTypes['ApiKey']>, ParentType, ContextType>
	identityProviders?: Resolver<ReadonlyArray<ResolversTypes['IdentityProvider']>, ParentType, ContextType>
	mailTemplates?: Resolver<ReadonlyArray<ResolversTypes['MailTemplateData']>, ParentType, ContextType>
	me?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
	personById?: Resolver<Maybe<ResolversTypes['Person']>, ParentType, ContextType, RequireFields<QueryPersonByIdArgs, 'id'>>
	persons?: Resolver<ReadonlyArray<ResolversTypes['Person']>, ParentType, ContextType, Partial<QueryPersonsArgs>>
	projectBySlug?: Resolver<Maybe<ResolversTypes['Project']>, ParentType, ContextType, RequireFields<QueryProjectBySlugArgs, 'slug'>>
	projectMemberships?: Resolver<
		ReadonlyArray<ResolversTypes['Membership']>,
		ParentType,
		ContextType,
		RequireFields<QueryProjectMembershipsArgs, 'identityId' | 'projectSlug'>
	>
	projects?: Resolver<ReadonlyArray<ResolversTypes['Project']>, ParentType, ContextType>
}

export type RegenerateBackupCodesErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RegenerateBackupCodesError'] = ResolversParentTypes['RegenerateBackupCodesError'],
> = {
	code?: Resolver<ResolversTypes['RegenerateBackupCodesErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type RegenerateBackupCodesResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RegenerateBackupCodesResponse'] = ResolversParentTypes['RegenerateBackupCodesResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['RegenerateBackupCodesError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['RegenerateBackupCodesResult']>, ParentType, ContextType>
}

export type RegenerateBackupCodesResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RegenerateBackupCodesResult'] = ResolversParentTypes['RegenerateBackupCodesResult'],
> = {
	backupCodes?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
}

export type RemoveGlobalIdentityRolesErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveGlobalIdentityRolesError'] = ResolversParentTypes['RemoveGlobalIdentityRolesError'],
> = {
	code?: Resolver<ResolversTypes['RemoveGlobalIdentityRolesErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type RemoveGlobalIdentityRolesResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveGlobalIdentityRolesResponse'] = ResolversParentTypes['RemoveGlobalIdentityRolesResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['RemoveGlobalIdentityRolesError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['RemoveGlobalIdentityRolesResult']>, ParentType, ContextType>
}

export type RemoveGlobalIdentityRolesResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveGlobalIdentityRolesResult'] = ResolversParentTypes['RemoveGlobalIdentityRolesResult'],
> = {
	identity?: Resolver<ResolversTypes['Identity'], ParentType, ContextType>
}

export type RemoveMailTemplateErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveMailTemplateError'] = ResolversParentTypes['RemoveMailTemplateError'],
> = {
	code?: Resolver<ResolversTypes['RemoveMailTemplateErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type RemoveMailTemplateResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveMailTemplateResponse'] = ResolversParentTypes['RemoveMailTemplateResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['RemoveMailTemplateError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['RemoveMailTemplateError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type RemoveProjectMemberErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveProjectMemberError'] = ResolversParentTypes['RemoveProjectMemberError'],
> = {
	code?: Resolver<ResolversTypes['RemoveProjectMemberErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type RemoveProjectMemberResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RemoveProjectMemberResponse'] = ResolversParentTypes['RemoveProjectMemberResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['RemoveProjectMemberError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['RemoveProjectMemberError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type RequestEmailVerificationErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RequestEmailVerificationError'] = ResolversParentTypes['RequestEmailVerificationError'],
> = {
	code?: Resolver<ResolversTypes['RequestEmailVerificationErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type RequestEmailVerificationResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RequestEmailVerificationResponse'] = ResolversParentTypes['RequestEmailVerificationResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['RequestEmailVerificationError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ResetPasswordErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ResetPasswordError'] = ResolversParentTypes['ResetPasswordError'],
> = {
	code?: Resolver<ResolversTypes['ResetPasswordErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	weakPasswordReasons?: Resolver<Maybe<ReadonlyArray<ResolversTypes['WeakPasswordReason']>>, ParentType, ContextType>
}

export type ResetPasswordResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ResetPasswordResponse'] = ResolversParentTypes['ResetPasswordResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ResetPasswordError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['ResetPasswordError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type ResetPersonMfaErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ResetPersonMfaError'] = ResolversParentTypes['ResetPersonMfaError'],
> = {
	code?: Resolver<ResolversTypes['ResetPersonMfaErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ResetPersonMfaResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ResetPersonMfaResponse'] = ResolversParentTypes['ResetPersonMfaResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ResetPersonMfaError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type RevokeSessionErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RevokeSessionError'] = ResolversParentTypes['RevokeSessionError'],
> = {
	code?: Resolver<ResolversTypes['RevokeSessionErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type RevokeSessionResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RevokeSessionResponse'] = ResolversParentTypes['RevokeSessionResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['RevokeSessionError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type RoleConditionVariableDefinitionResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RoleConditionVariableDefinition'] = ResolversParentTypes['RoleConditionVariableDefinition'],
> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RoleDefinitionResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RoleDefinition'] = ResolversParentTypes['RoleDefinition'],
> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	variables?: Resolver<ReadonlyArray<ResolversTypes['RoleVariableDefinition']>, ParentType, ContextType>
}

export type RoleEntityVariableDefinitionResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RoleEntityVariableDefinition'] = ResolversParentTypes['RoleEntityVariableDefinition'],
> = {
	entityName?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RolePredefinedVariableDefinitionResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RolePredefinedVariableDefinition'] = ResolversParentTypes['RolePredefinedVariableDefinition'],
> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	value?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type RoleVariableDefinitionResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['RoleVariableDefinition'] = ResolversParentTypes['RoleVariableDefinition'],
> = {
	__resolveType: TypeResolveFn<
		'RoleConditionVariableDefinition' | 'RoleEntityVariableDefinition' | 'RolePredefinedVariableDefinition',
		ParentType,
		ContextType
	>
}

export type SessionInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['SessionInfo'] = ResolversParentTypes['SessionInfo']> = {
	createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>
	createdIp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	createdUserAgent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	expiresAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	id?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	isCurrent?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	lastIp?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	lastUsedAt?: Resolver<Maybe<ResolversTypes['DateTime']>, ParentType, ContextType>
	lastUserAgent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	trustForwardedClientInfo?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type SetProjectSecretErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SetProjectSecretError'] = ResolversParentTypes['SetProjectSecretError'],
> = {
	code?: Resolver<ResolversTypes['SetProjectSecretErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type SetProjectSecretResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SetProjectSecretResponse'] = ResolversParentTypes['SetProjectSecretResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['SetProjectSecretError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type SignInErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInError'] = ResolversParentTypes['SignInError']> = {
	code?: Resolver<ResolversTypes['SignInErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	mfaEnrollment?: Resolver<Maybe<ResolversTypes['MfaEnrollment']>, ParentType, ContextType>
	retryAfter?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>
}

export type SignInIdpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInIDPError'] = ResolversParentTypes['SignInIDPError'],
> = {
	code?: Resolver<ResolversTypes['SignInIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
}

export type SignInIdpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInIDPResponse'] = ResolversParentTypes['SignInIDPResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['SignInIDPError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignInIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignInIDPResult']>, ParentType, ContextType>
}

export type SignInIdpResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInIDPResult'] = ResolversParentTypes['SignInIDPResult'],
> = {
	idpResponse?: Resolver<Maybe<ResolversTypes['Json']>, ParentType, ContextType>
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInPasswordlessErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInPasswordlessError'] = ResolversParentTypes['SignInPasswordlessError'],
> = {
	code?: Resolver<ResolversTypes['SignInPasswordlessErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type SignInPasswordlessResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInPasswordlessResponse'] = ResolversParentTypes['SignInPasswordlessResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['SignInPasswordlessError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignInPasswordlessResult']>, ParentType, ContextType>
}

export type SignInPasswordlessResultResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInPasswordlessResult'] = ResolversParentTypes['SignInPasswordlessResult'],
> = {
	person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
}

export type SignInResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignInResponse'] = ResolversParentTypes['SignInResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['SignInError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignInError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignInResult']>, ParentType, ContextType>
}

export type SignInResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignInResult'] = ResolversParentTypes['SignInResult']> =
	{
		backupCodes?: Resolver<Maybe<ReadonlyArray<ResolversTypes['String']>>, ParentType, ContextType>
		person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
		token?: Resolver<ResolversTypes['String'], ParentType, ContextType>
		__isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>
	}

export type SignOutErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignOutError'] = ResolversParentTypes['SignOutError']> =
	{
		code?: Resolver<ResolversTypes['SignOutErrorCode'], ParentType, ContextType>
		developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
		endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	}

export type SignOutResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignOutResponse'] = ResolversParentTypes['SignOutResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['SignOutError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignOutError']>, ParentType, ContextType>
	logoutUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type SignUpErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignUpError'] = ResolversParentTypes['SignUpError']> = {
	code?: Resolver<ResolversTypes['SignUpErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endPersonMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	recommendedAction?: Resolver<Maybe<ResolversTypes['SignUpRecommendedAction']>, ParentType, ContextType>
	weakPasswordReasons?: Resolver<Maybe<ReadonlyArray<ResolversTypes['WeakPasswordReason']>>, ParentType, ContextType>
}

export type SignUpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['SignUpResponse'] = ResolversParentTypes['SignUpResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['SignUpError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['SignUpError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
	result?: Resolver<Maybe<ResolversTypes['SignUpResult']>, ParentType, ContextType>
}

export type SignUpResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['SignUpResult'] = ResolversParentTypes['SignUpResult']> =
	{
		person?: Resolver<ResolversTypes['Person'], ParentType, ContextType>
	}

export type ToggleMyPasswordlessErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ToggleMyPasswordlessError'] = ResolversParentTypes['ToggleMyPasswordlessError'],
> = {
	code?: Resolver<ResolversTypes['ToggleMyPasswordlessErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type ToggleMyPasswordlessResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['ToggleMyPasswordlessResponse'] = ResolversParentTypes['ToggleMyPasswordlessResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['ToggleMyPasswordlessError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type UpdateAuthPolicyErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateAuthPolicyError'] = ResolversParentTypes['UpdateAuthPolicyError'],
> = {
	code?: Resolver<ResolversTypes['UpdateAuthPolicyErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type UpdateAuthPolicyResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateAuthPolicyResponse'] = ResolversParentTypes['UpdateAuthPolicyResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['UpdateAuthPolicyError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type UpdateCustomRoleErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateCustomRoleError'] = ResolversParentTypes['UpdateCustomRoleError'],
> = {
	code?: Resolver<ResolversTypes['UpdateCustomRoleErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type UpdateCustomRoleResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateCustomRoleResponse'] = ResolversParentTypes['UpdateCustomRoleResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['UpdateCustomRoleError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type UpdateIdpErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateIDPError'] = ResolversParentTypes['UpdateIDPError'],
> = {
	code?: Resolver<ResolversTypes['UpdateIDPErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type UpdateIdpResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateIDPResponse'] = ResolversParentTypes['UpdateIDPResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['UpdateIDPError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type UpdateProjectErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateProjectError'] = ResolversParentTypes['UpdateProjectError'],
> = {
	code?: Resolver<ResolversTypes['UpdateProjectErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type UpdateProjectMemberErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateProjectMemberError'] = ResolversParentTypes['UpdateProjectMemberError'],
> = {
	code?: Resolver<ResolversTypes['UpdateProjectMemberErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	endUserMessage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>
	membershipValidation?: Resolver<Maybe<ReadonlyArray<ResolversTypes['MembershipValidationError']>>, ParentType, ContextType>
}

export type UpdateProjectMemberResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateProjectMemberResponse'] = ResolversParentTypes['UpdateProjectMemberResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['UpdateProjectMemberError']>, ParentType, ContextType>
	errors?: Resolver<ReadonlyArray<ResolversTypes['UpdateProjectMemberError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type UpdateProjectResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['UpdateProjectResponse'] = ResolversParentTypes['UpdateProjectResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['UpdateProjectError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type VariableEntryResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['VariableEntry'] = ResolversParentTypes['VariableEntry'],
> = {
	name?: Resolver<ResolversTypes['String'], ParentType, ContextType>
	values?: Resolver<ReadonlyArray<ResolversTypes['String']>, ParentType, ContextType>
}

export type VerifyEmailErrorResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['VerifyEmailError'] = ResolversParentTypes['VerifyEmailError'],
> = {
	code?: Resolver<ResolversTypes['VerifyEmailErrorCode'], ParentType, ContextType>
	developerMessage?: Resolver<ResolversTypes['String'], ParentType, ContextType>
}

export type VerifyEmailResponseResolvers<
	ContextType = any,
	ParentType extends ResolversParentTypes['VerifyEmailResponse'] = ResolversParentTypes['VerifyEmailResponse'],
> = {
	error?: Resolver<Maybe<ResolversTypes['VerifyEmailError']>, ParentType, ContextType>
	ok?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>
}

export type Resolvers<ContextType = any> = {
	ActivatePasswordlessOtpError?: ActivatePasswordlessOtpErrorResolvers<ContextType>
	ActivatePasswordlessOtpResponse?: ActivatePasswordlessOtpResponseResolvers<ContextType>
	AddGlobalIdentityRolesError?: AddGlobalIdentityRolesErrorResolvers<ContextType>
	AddGlobalIdentityRolesResponse?: AddGlobalIdentityRolesResponseResolvers<ContextType>
	AddGlobalIdentityRolesResult?: AddGlobalIdentityRolesResultResolvers<ContextType>
	AddIDPError?: AddIdpErrorResolvers<ContextType>
	AddIDPResponse?: AddIdpResponseResolvers<ContextType>
	AddMailTemplateError?: AddMailTemplateErrorResolvers<ContextType>
	AddMailTemplateResponse?: AddMailTemplateResponseResolvers<ContextType>
	AddProjectMemberError?: AddProjectMemberErrorResolvers<ContextType>
	AddProjectMemberResponse?: AddProjectMemberResponseResolvers<ContextType>
	ApiKey?: ApiKeyResolvers<ContextType>
	ApiKeyWithToken?: ApiKeyWithTokenResolvers<ContextType>
	AuthLogEntry?: AuthLogEntryResolvers<ContextType>
	AuthLogPage?: AuthLogPageResolvers<ContextType>
	AuthPolicy?: AuthPolicyResolvers<ContextType>
	ChangeMyPasswordError?: ChangeMyPasswordErrorResolvers<ContextType>
	ChangeMyPasswordResponse?: ChangeMyPasswordResponseResolvers<ContextType>
	ChangeMyProfileError?: ChangeMyProfileErrorResolvers<ContextType>
	ChangeMyProfileResponse?: ChangeMyProfileResponseResolvers<ContextType>
	ChangePasswordError?: ChangePasswordErrorResolvers<ContextType>
	ChangePasswordResponse?: ChangePasswordResponseResolvers<ContextType>
	ChangeProfileError?: ChangeProfileErrorResolvers<ContextType>
	ChangeProfileResponse?: ChangeProfileResponseResolvers<ContextType>
	CheckResetPasswordTokenResult?: CheckResetPasswordTokenResultResolvers<ContextType>
	CommonSignInResult?: CommonSignInResultResolvers<ContextType>
	Config?: ConfigResolvers<ContextType>
	ConfigCaptcha?: ConfigCaptchaResolvers<ContextType>
	ConfigCaptchaProtect?: ConfigCaptchaProtectResolvers<ContextType>
	ConfigEmailChange?: ConfigEmailChangeResolvers<ContextType>
	ConfigLogin?: ConfigLoginResolvers<ContextType>
	ConfigLoginAnomalyDetection?: ConfigLoginAnomalyDetectionResolvers<ContextType>
	ConfigPassword?: ConfigPasswordResolvers<ContextType>
	ConfigPasswordless?: ConfigPasswordlessResolvers<ContextType>
	ConfigRateLimitWindow?: ConfigRateLimitWindowResolvers<ContextType>
	ConfigRateLimits?: ConfigRateLimitsResolvers<ContextType>
	ConfigSignup?: ConfigSignupResolvers<ContextType>
	ConfigureError?: ConfigureErrorResolvers<ContextType>
	ConfigureResponse?: ConfigureResponseResolvers<ContextType>
	ConfirmEmailChangeError?: ConfirmEmailChangeErrorResolvers<ContextType>
	ConfirmEmailChangeResponse?: ConfirmEmailChangeResponseResolvers<ContextType>
	ConfirmEmailOtpError?: ConfirmEmailOtpErrorResolvers<ContextType>
	ConfirmEmailOtpResponse?: ConfirmEmailOtpResponseResolvers<ContextType>
	ConfirmEmailOtpResult?: ConfirmEmailOtpResultResolvers<ContextType>
	ConfirmOtpError?: ConfirmOtpErrorResolvers<ContextType>
	ConfirmOtpResponse?: ConfirmOtpResponseResolvers<ContextType>
	ConfirmOtpResult?: ConfirmOtpResultResolvers<ContextType>
	CreateApiKeyError?: CreateApiKeyErrorResolvers<ContextType>
	CreateApiKeyResponse?: CreateApiKeyResponseResolvers<ContextType>
	CreateApiKeyResult?: CreateApiKeyResultResolvers<ContextType>
	CreateAuthPolicyError?: CreateAuthPolicyErrorResolvers<ContextType>
	CreateAuthPolicyResponse?: CreateAuthPolicyResponseResolvers<ContextType>
	CreateAuthPolicyResult?: CreateAuthPolicyResultResolvers<ContextType>
	CreateCustomRoleError?: CreateCustomRoleErrorResolvers<ContextType>
	CreateCustomRoleResponse?: CreateCustomRoleResponseResolvers<ContextType>
	CreatePasswordResetRequestError?: CreatePasswordResetRequestErrorResolvers<ContextType>
	CreatePasswordResetRequestResponse?: CreatePasswordResetRequestResponseResolvers<ContextType>
	CreateProjectResponse?: CreateProjectResponseResolvers<ContextType>
	CreateProjectResponseError?: CreateProjectResponseErrorResolvers<ContextType>
	CreateProjectResult?: CreateProjectResultResolvers<ContextType>
	CreateSessionTokenError?: CreateSessionTokenErrorResolvers<ContextType>
	CreateSessionTokenResponse?: CreateSessionTokenResponseResolvers<ContextType>
	CreateSessionTokenResult?: CreateSessionTokenResultResolvers<ContextType>
	CustomRole?: CustomRoleResolvers<ContextType>
	CustomRoleGrant?: CustomRoleGrantResolvers<ContextType>
	CustomRolePermissionDefinition?: CustomRolePermissionDefinitionResolvers<ContextType>
	DateTime?: GraphQLScalarType
	DeleteAuthPolicyError?: DeleteAuthPolicyErrorResolvers<ContextType>
	DeleteAuthPolicyResponse?: DeleteAuthPolicyResponseResolvers<ContextType>
	DeleteCustomRoleError?: DeleteCustomRoleErrorResolvers<ContextType>
	DeleteCustomRoleResponse?: DeleteCustomRoleResponseResolvers<ContextType>
	DisableApiKeyError?: DisableApiKeyErrorResolvers<ContextType>
	DisableApiKeyResponse?: DisableApiKeyResponseResolvers<ContextType>
	DisableEmailOtpError?: DisableEmailOtpErrorResolvers<ContextType>
	DisableEmailOtpResponse?: DisableEmailOtpResponseResolvers<ContextType>
	DisableIDPError?: DisableIdpErrorResolvers<ContextType>
	DisableIDPResponse?: DisableIdpResponseResolvers<ContextType>
	DisableOtpError?: DisableOtpErrorResolvers<ContextType>
	DisableOtpResponse?: DisableOtpResponseResolvers<ContextType>
	DisablePersonError?: DisablePersonErrorResolvers<ContextType>
	DisablePersonResponse?: DisablePersonResponseResolvers<ContextType>
	DisconnectIDPError?: DisconnectIdpErrorResolvers<ContextType>
	DisconnectIDPResponse?: DisconnectIdpResponseResolvers<ContextType>
	EnableIDPError?: EnableIdpErrorResolvers<ContextType>
	EnableIDPResponse?: EnableIdpResponseResolvers<ContextType>
	ForceSignOutPersonError?: ForceSignOutPersonErrorResolvers<ContextType>
	ForceSignOutPersonResponse?: ForceSignOutPersonResponseResolvers<ContextType>
	IDPOptionsOutput?: IdpOptionsOutputResolvers<ContextType>
	Identity?: IdentityResolvers<ContextType>
	IdentityGlobalPermissions?: IdentityGlobalPermissionsResolvers<ContextType>
	IdentityProjectRelation?: IdentityProjectRelationResolvers<ContextType>
	IdentityProvider?: IdentityProviderResolvers<ContextType>
	IdentityProviderListItem?: IdentityProviderListItemResolvers<ContextType>
	InitEmailOtpError?: InitEmailOtpErrorResolvers<ContextType>
	InitEmailOtpResponse?: InitEmailOtpResponseResolvers<ContextType>
	InitSignInIDPError?: InitSignInIdpErrorResolvers<ContextType>
	InitSignInIDPResponse?: InitSignInIdpResponseResolvers<ContextType>
	InitSignInIDPResult?: InitSignInIdpResultResolvers<ContextType>
	InitSignInPasswordlessError?: InitSignInPasswordlessErrorResolvers<ContextType>
	InitSignInPasswordlessResponse?: InitSignInPasswordlessResponseResolvers<ContextType>
	InitSignInPasswordlessResult?: InitSignInPasswordlessResultResolvers<ContextType>
	Interval?: GraphQLScalarType
	InviteError?: InviteErrorResolvers<ContextType>
	InviteResponse?: InviteResponseResolvers<ContextType>
	InviteResult?: InviteResultResolvers<ContextType>
	Json?: GraphQLScalarType
	MailTemplateData?: MailTemplateDataResolvers<ContextType>
	Membership?: MembershipResolvers<ContextType>
	MembershipValidationError?: MembershipValidationErrorResolvers<ContextType>
	MfaEnrollment?: MfaEnrollmentResolvers<ContextType>
	Mutation?: MutationResolvers<ContextType>
	Person?: PersonResolvers<ContextType>
	PersonIdentityProvider?: PersonIdentityProviderResolvers<ContextType>
	PrepareOtpResponse?: PrepareOtpResponseResolvers<ContextType>
	PrepareOtpResult?: PrepareOtpResultResolvers<ContextType>
	Project?: ProjectResolvers<ContextType>
	ProjectIdentityRelation?: ProjectIdentityRelationResolvers<ContextType>
	ProjectSecretInfo?: ProjectSecretInfoResolvers<ContextType>
	Query?: QueryResolvers<ContextType>
	RegenerateBackupCodesError?: RegenerateBackupCodesErrorResolvers<ContextType>
	RegenerateBackupCodesResponse?: RegenerateBackupCodesResponseResolvers<ContextType>
	RegenerateBackupCodesResult?: RegenerateBackupCodesResultResolvers<ContextType>
	RemoveGlobalIdentityRolesError?: RemoveGlobalIdentityRolesErrorResolvers<ContextType>
	RemoveGlobalIdentityRolesResponse?: RemoveGlobalIdentityRolesResponseResolvers<ContextType>
	RemoveGlobalIdentityRolesResult?: RemoveGlobalIdentityRolesResultResolvers<ContextType>
	RemoveMailTemplateError?: RemoveMailTemplateErrorResolvers<ContextType>
	RemoveMailTemplateResponse?: RemoveMailTemplateResponseResolvers<ContextType>
	RemoveProjectMemberError?: RemoveProjectMemberErrorResolvers<ContextType>
	RemoveProjectMemberResponse?: RemoveProjectMemberResponseResolvers<ContextType>
	RequestEmailVerificationError?: RequestEmailVerificationErrorResolvers<ContextType>
	RequestEmailVerificationResponse?: RequestEmailVerificationResponseResolvers<ContextType>
	ResetPasswordError?: ResetPasswordErrorResolvers<ContextType>
	ResetPasswordResponse?: ResetPasswordResponseResolvers<ContextType>
	ResetPersonMfaError?: ResetPersonMfaErrorResolvers<ContextType>
	ResetPersonMfaResponse?: ResetPersonMfaResponseResolvers<ContextType>
	RevokeSessionError?: RevokeSessionErrorResolvers<ContextType>
	RevokeSessionResponse?: RevokeSessionResponseResolvers<ContextType>
	RoleConditionVariableDefinition?: RoleConditionVariableDefinitionResolvers<ContextType>
	RoleDefinition?: RoleDefinitionResolvers<ContextType>
	RoleEntityVariableDefinition?: RoleEntityVariableDefinitionResolvers<ContextType>
	RolePredefinedVariableDefinition?: RolePredefinedVariableDefinitionResolvers<ContextType>
	RoleVariableDefinition?: RoleVariableDefinitionResolvers<ContextType>
	SessionInfo?: SessionInfoResolvers<ContextType>
	SetProjectSecretError?: SetProjectSecretErrorResolvers<ContextType>
	SetProjectSecretResponse?: SetProjectSecretResponseResolvers<ContextType>
	SignInError?: SignInErrorResolvers<ContextType>
	SignInIDPError?: SignInIdpErrorResolvers<ContextType>
	SignInIDPResponse?: SignInIdpResponseResolvers<ContextType>
	SignInIDPResult?: SignInIdpResultResolvers<ContextType>
	SignInPasswordlessError?: SignInPasswordlessErrorResolvers<ContextType>
	SignInPasswordlessResponse?: SignInPasswordlessResponseResolvers<ContextType>
	SignInPasswordlessResult?: SignInPasswordlessResultResolvers<ContextType>
	SignInResponse?: SignInResponseResolvers<ContextType>
	SignInResult?: SignInResultResolvers<ContextType>
	SignOutError?: SignOutErrorResolvers<ContextType>
	SignOutResponse?: SignOutResponseResolvers<ContextType>
	SignUpError?: SignUpErrorResolvers<ContextType>
	SignUpResponse?: SignUpResponseResolvers<ContextType>
	SignUpResult?: SignUpResultResolvers<ContextType>
	ToggleMyPasswordlessError?: ToggleMyPasswordlessErrorResolvers<ContextType>
	ToggleMyPasswordlessResponse?: ToggleMyPasswordlessResponseResolvers<ContextType>
	UpdateAuthPolicyError?: UpdateAuthPolicyErrorResolvers<ContextType>
	UpdateAuthPolicyResponse?: UpdateAuthPolicyResponseResolvers<ContextType>
	UpdateCustomRoleError?: UpdateCustomRoleErrorResolvers<ContextType>
	UpdateCustomRoleResponse?: UpdateCustomRoleResponseResolvers<ContextType>
	UpdateIDPError?: UpdateIdpErrorResolvers<ContextType>
	UpdateIDPResponse?: UpdateIdpResponseResolvers<ContextType>
	UpdateProjectError?: UpdateProjectErrorResolvers<ContextType>
	UpdateProjectMemberError?: UpdateProjectMemberErrorResolvers<ContextType>
	UpdateProjectMemberResponse?: UpdateProjectMemberResponseResolvers<ContextType>
	UpdateProjectResponse?: UpdateProjectResponseResolvers<ContextType>
	VariableEntry?: VariableEntryResolvers<ContextType>
	VerifyEmailError?: VerifyEmailErrorResolvers<ContextType>
	VerifyEmailResponse?: VerifyEmailResponseResolvers<ContextType>
}
