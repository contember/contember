import { gql } from 'graphql-tag'
import { DocumentNode } from 'graphql'

const schema: DocumentNode = gql`
	scalar Json
	scalar DateTime
	
	""" Interval is a string in the format ISO 8601, e.g. "PT1H" for 1 hour """
	scalar Interval

	schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		me: Identity!
		personById(id: String!): Person
		projects: [Project!]!
		projectBySlug(slug: String!): Project
		projectMemberships(projectSlug: String!, identityId: String!): [Membership!]!
		checkResetPasswordToken(requestId: String!, token: String!): CheckResetPasswordTokenCode!

		identityProviders: [IdentityProvider!]!
		mailTemplates: [MailTemplateData!]!

		configuration: Config!

		"""
		List configured auth policies (per-role MFA / session policy). Requires the
		\`system:configure\` permission — by default granted only to SUPER_ADMIN
		(and PROJECT_ADMIN, like \`configure\`). With no rows configured, MFA
		enforcement is inert and sign-in behaves exactly as today.
		"""
		authPolicies: [AuthPolicy!]!

		"""
		Read the tenant audit log (\`person_auth_log\`). Requires the
		\`system:viewAuthLog\` permission — by default granted only to
		SUPER_ADMIN via the wildcard ALL-resource/ALL-privilege grant.
		Ordered by created_at DESC. Page size is capped server-side
		(default 100, max 500); \`hasMore\` indicates a further page exists.
		"""
		authLog(filter: AuthLogFilter, limit: Int, offset: Int): AuthLogPage!

		policies: [Policy!]!
		policy(slug: String!): Policy
		builtinPolicies: [BuiltinPolicy!]!
	}

	type Mutation {
		signUp(email: String!, password: String, passwordHash: String, roles: [String!], name: String, captchaToken: String): SignUpResponse
		signIn(email: String!, password: String!, expiration: Int, otpToken: String, backupCode: String, options: SignInOptions): SignInResponse
		createSessionToken(email: String, personId: String, expiration: Int, options: SignInOptions): CreateSessionTokenResponse
		signOut(all: Boolean): SignOutResponse
		changeProfile(personId: String!, email: String, name: String): ChangeProfileResponse
		changeMyProfile(email: String, name: String): ChangeMyProfileResponse
		changePassword(personId: String!, password: String!): ChangePasswordResponse
		changeMyPassword(currentPassword: String!, newPassword: String!): ChangeMyPasswordResponse

		initSignInIDP(
			identityProvider: String!,
			data: Json
			redirectUrl: String @deprecated(reason: "use data.redirectUrl")
		): InitSignInIDPResponse
		signInIDP(
			identityProvider: String!,
			data: Json,
			expiration: Int
			options: SignInOptions
			idpResponse: IDPResponseInput, @deprecated(reason: "pass idpResponse.url as data.url")
			redirectUrl: String @deprecated(reason: "use data.redirectUrl"),
			sessionData: Json @deprecated(reason: "use data.sessionData"),
		): SignInIDPResponse
		
		# passwordless sign in
		initSignInPasswordless(email: String!, options: InitSignInPasswordlessOptions, captchaToken: String): InitSignInPasswordlessResponse
		signInPasswordless(requestId: String!, validationType: PasswordlessValidationType!, token: String!, expiration: Int, mfaOtp: String, backupCode: String, options: SignInOptions): SignInPasswordlessResponse
		activatePasswordlessOtp(requestId: String!, token: String!, otpHash: String!): ActivatePasswordlessOtpResponse

        enableMyPasswordless: ToggleMyPasswordlessResponse
        disableMyPasswordless: ToggleMyPasswordlessResponse

		# IDP management
		addIDP(identityProvider: String!, type: String!, configuration: Json!, options: IDPOptions): AddIDPResponse
		updateIDP(identityProvider: String!, type: String, configuration: Json, options: IDPOptions, mergeConfiguration: Boolean): UpdateIDPResponse
		disableIDP(identityProvider: String!): DisableIDPResponse
		enableIDP(identityProvider: String!): EnableIDPResponse

		prepareOtp(label: String): PrepareOtpResponse
		confirmOtp(otpToken: String!): ConfirmOtpResponse
		disableOtp: DisableOtpResponse
		regenerateBackupCodes: RegenerateBackupCodesResponse

		initEmailOtp: InitEmailOtpResponse
		confirmEmailOtp(otpToken: String!): ConfirmEmailOtpResponse
		disableEmailOtp: DisableEmailOtpResponse

		disablePerson(personId: String!): DisablePersonResponse
		forceSignOutPerson(personId: String!, reason: String): ForceSignOutPersonResponse
		resetPersonMfa(personId: String!): ResetPersonMfaResponse
		revokeSession(sessionId: String!): RevokeSessionResponse

		createResetPasswordRequest(email: String!, options: CreateResetPasswordRequestOptions, captchaToken: String): CreatePasswordResetRequestResponse
		resetPassword(token: String!, password: String!): ResetPasswordResponse

		"""
		(Re)send the e-mail verification link for the given address. Always
		reports ok regardless of whether the address exists or is already
		verified, to avoid leaking account existence.
		"""
		requestEmailVerification(email: String!, options: EmailVerificationOptions, captchaToken: String): RequestEmailVerificationResponse
		verifyEmail(token: String!): VerifyEmailResponse
		"""
		Confirm a pending e-mail change (see changeMyProfile when
		config.signup.requireEmailVerification is enabled). Consumes the token
		that was mailed to the new address, swaps the address, and signs out all
		existing sessions.
		"""
		confirmEmailChange(token: String!): ConfirmEmailChangeResponse

		invite(email: String!, name: String, projectSlug: String!, memberships: [MembershipInput!]!, options: InviteOptions): InviteResponse
		unmanagedInvite(
			email: String!,
			name: String,
			projectSlug: String!,
			memberships: [MembershipInput!]!,
			options: UnmanagedInviteOptions,
			password: String @deprecated(reason: "Use options")
		): InviteResponse

		addProjectMember(projectSlug: String!, identityId: String!, memberships: [MembershipInput!]!): AddProjectMemberResponse
		removeProjectMember(projectSlug: String!, identityId: String!): RemoveProjectMemberResponse

		updateProjectMember(projectSlug: String!, identityId: String!, memberships: [MembershipInput!]!): UpdateProjectMemberResponse

		createApiKey(projectSlug: String!, memberships: [MembershipInput!]!, description: String!, tokenHash: String, options: CreateApiKeyOptions): CreateApiKeyResponse
		createGlobalApiKey(description: String!, roles: [String!], tokenHash: String, options: CreateApiKeyOptions): CreateApiKeyResponse
		disableApiKey(id: String!): DisableApiKeyResponse
		addGlobalIdentityRoles(identityId: String!, roles: [String!]!): AddGlobalIdentityRolesResponse
		removeGlobalIdentityRoles(identityId: String!, roles: [String!]!): RemoveGlobalIdentityRolesResponse

		addMailTemplate(template: MailTemplate!): AddMailTemplateResponse
		removeMailTemplate(templateIdentifier: MailTemplateIdentifier!): RemoveMailTemplateResponse

		createProject(
			projectSlug: String!,
			name: String,
			config: Json,
			secrets: [ProjectSecret!],
			options: CreateProjectOptions,
			deployTokenHash: String @deprecated(reason: "Use options")
		): CreateProjectResponse
		setProjectSecret(projectSlug: String!, key: String!, value: String!): SetProjectSecretResponse
		updateProject(projectSlug: String!, name: String, config: Json, mergeConfig: Boolean): UpdateProjectResponse
		
		configure(config: ConfigInput!): ConfigureResponse

		# === auth policy (per-role MFA / session policy) ===
		createAuthPolicy(policy: AuthPolicyInput!): CreateAuthPolicyResponse
		updateAuthPolicy(id: String!, policy: AuthPolicyInput!): UpdateAuthPolicyResponse
		deleteAuthPolicy(id: String!): DeleteAuthPolicyResponse

		addProjectMailTemplate(template: MailTemplate!): AddMailTemplateResponse
		@deprecated(reason: "use addMailTemplate")

		removeProjectMailTemplate(templateIdentifier: MailTemplateIdentifier!): RemoveMailTemplateResponse
		@deprecated(reason: "use removeMailTemplate")

		createPolicy(input: CreatePolicyInput!): CreatePolicyResponse
		updatePolicy(slug: String!, input: UpdatePolicyInput!): UpdatePolicyResponse
		deletePolicy(slug: String!): DeletePolicyResponse
		assignPolicy(identityId: String!, policySlug: String!, tags: Json): AssignPolicyResponse
		revokePolicy(identityId: String!, policySlug: String!): RevokePolicyResponse
	}
	
	# === configure ===
	
	type Config {
		signup: ConfigSignup!
		emailChange: ConfigEmailChange!
		passwordless: ConfigPasswordless!
		password: ConfigPassword!
		login: ConfigLogin!
		captcha: ConfigCaptcha!
		rateLimits: ConfigRateLimits!
	}

	type ConfigSignup {
		"""
		When true, new accounts must verify their e-mail address before they can
		sign in. The requirement is captured per account at sign-up, so toggling
		this only affects accounts created afterwards. Defaults to false (no
		change vs. previous behavior). E-mail changes are governed separately by
		ConfigEmailChange.requireVerification.
		"""
		requireEmailVerification: Boolean!
	}

	type ConfigEmailChange {
		"""
		When true, a user-initiated changeMyProfile e-mail change does not swap
		the address immediately: it goes through a confirmation flow
		(confirmEmailChange) against a token mailed to the new address, and the
		old address stays active until the new one is confirmed. Independent of
		ConfigSignup.requireEmailVerification. Defaults to false.
		"""
		requireVerification: Boolean!
	}

	type ConfigPasswordless {
		enabled: ConfigPolicy!
		url: String
		expiration: Interval!
	}

	type ConfigPassword {
		minLength: Int!
		requireUppercase: Int!
		requireLowercase: Int!
		requireDigit: Int!
		requireSpecial: Int!
		pattern: String
		checkBlacklist: Boolean!
		checkHibp: Boolean!
    }

	type ConfigLogin {
		baseBackoff: Interval!
		maxBackoff: Interval!
		attemptWindow: Interval!
		revealUserExists: Boolean!
		"""
		If false, signIn collapses NO_PASSWORD_SET / INVALID_PASSWORD into a
		generic INVALID_CREDENTIALS and signUp omits the recommendedAction
		hint on EMAIL_ALREADY_EXISTS errors. UNKNOWN_EMAIL and existence-level
		signals are still controlled by revealUserExists. Defaults to true
		(no change vs. previous behavior).
		"""
		revealLoginMethod: Boolean!
		defaultTokenExpiration: Interval!
		maxTokenExpiration: Interval
		mfaGraceDuration: Interval!
    }

	"""
	Captcha config. The secret is never exposed; only the provider and (where
	applicable) the threshold are readable.
	"""
	type ConfigCaptcha {
		provider: CaptchaProvider
		threshold: Float
		protect: ConfigCaptchaProtect!
	}

	"""
	Per-flow captcha enforcement. The captcha provider/secret is shared; these
	flags decide which mutations actually require a captcha token when a provider
	is configured.
	"""
	type ConfigCaptchaProtect {
		signUp: Boolean!
		passwordReset: Boolean!
		passwordlessInit: Boolean!
		emailVerification: Boolean!
	}

	enum CaptchaProvider {
		turnstile
		hcaptcha
		recaptchaV3
	}

	"""
	Configurable per-IP rate-limit windows. Each value bounds the number of
	attempts allowed from the same client IP in the configured window. Per-email
	throttling for password-reset and passwordless-init flows reuses the
	exponential backoff from ConfigLogin (baseBackoff / maxBackoff /
	attemptWindow) against person_auth_log entries.
	"""
	type ConfigRateLimits {
		signUpPerIp: ConfigRateLimitWindow!
		loginPerIp: ConfigRateLimitWindow!
		passwordResetPerIp: ConfigRateLimitWindow!
		passwordlessInitPerIp: ConfigRateLimitWindow!
		"""
		Caps how many email-OTP codes may be dispatched per person within the
		window (a brute-force / email-bomb backstop). Unlike the per-IP limits it
		ships enabled by default. Set limit to 0 to disable.
		"""
		emailOtpPerPerson: ConfigRateLimitWindow!
		emailVerificationPerIp: ConfigRateLimitWindow!
	}

	type ConfigRateLimitWindow {
		limit: Int!
		window: Interval!
	}

	input ConfigInput {
		signup: ConfigSignupInput
		emailChange: ConfigEmailChangeInput
		passwordless: ConfigPasswordlessInput
		password: ConfigPasswordInput
		login: ConfigLoginInput
		captcha: ConfigCaptchaInput
		rateLimits: ConfigRateLimitsInput
	}

	input ConfigSignupInput {
		requireEmailVerification: Boolean
	}

	input ConfigEmailChangeInput {
		requireVerification: Boolean
	}

	enum ConfigPolicy {
		always
		never
		optIn
		optOut
	}

	input ConfigPasswordlessInput {
		enabled: ConfigPolicy
		url: String
		expiration: Interval
	}

	input ConfigPasswordInput {
		minLength: Int
		requireUppercase: Int
		requireLowercase: Int
		requireDigit: Int
		requireSpecial: Int
		pattern: String
		checkBlacklist: Boolean
		checkHibp: Boolean
    }

	input ConfigLoginInput {
		baseBackoff: Interval
		maxBackoff: Interval
		attemptWindow: Interval
		revealUserExists: Boolean
		revealLoginMethod: Boolean
		defaultTokenExpiration: Interval
		maxTokenExpiration: Interval
		mfaGraceDuration: Interval
    }

	"""
	Provider null disables captcha verification. Secret is write-only.
	Pass null secret to leave the stored value unchanged; pass empty string to clear.
	"""
	input ConfigCaptchaInput {
		provider: CaptchaProvider
		secret: String
		threshold: Float
		protect: ConfigCaptchaProtectInput
	}

	input ConfigCaptchaProtectInput {
		signUp: Boolean
		passwordReset: Boolean
		passwordlessInit: Boolean
		emailVerification: Boolean
	}

	input ConfigRateLimitsInput {
		signUpPerIp: ConfigRateLimitWindowInput
		loginPerIp: ConfigRateLimitWindowInput
		passwordResetPerIp: ConfigRateLimitWindowInput
		passwordlessInitPerIp: ConfigRateLimitWindowInput
		emailOtpPerPerson: ConfigRateLimitWindowInput
		emailVerificationPerIp: ConfigRateLimitWindowInput
	}

	input ConfigRateLimitWindowInput {
		limit: Int
		window: Interval
	}
	
	type ConfigureResponse {
		ok: Boolean!
		error: ConfigureError
	}
	
	type ConfigureError {
		code: ConfigureErrorCode!
		developerMessage: String!
	}
	
	enum ConfigureErrorCode {
		INVALID_CONFIG
	}

	# === signUp ===
	type SignUpResponse {
		ok: Boolean!
		errors: [SignUpError!]! @deprecated
		error: SignUpError
		result: SignUpResult
	}

	type SignUpError {
		code: SignUpErrorCode!
        weakPasswordReasons: [WeakPasswordReason!]
		"""
		For EMAIL_ALREADY_EXISTS, the recommended next action client UIs should
		offer to the visitor. Null for unrelated error codes.
		"""
		recommendedAction: SignUpRecommendedAction
		developerMessage: String!
		endPersonMessage: String @deprecated
	}

	enum SignUpErrorCode {
		EMAIL_ALREADY_EXISTS
		INVALID_EMAIL_FORMAT
		TOO_WEAK
		INVALID_CAPTCHA
		RATE_LIMIT_EXCEEDED
	}

	enum SignUpRecommendedAction {
		SIGN_IN
		RESET_PASSWORD
	}

	type SignUpResult {
		person: Person!
	}

	# === signInCommon ==

	interface CommonSignInResult {
		token: String!
		person: Person!
	}

	# === signIn ===
	input SignInOptions {
		"""
		If true, and the calling api_key has trust_forwarded_info=true,
		the resulting session token will trust X-Contember-Client-IP and
		X-Contember-Client-User-Agent headers on subsequent requests.
		Silently ignored when the caller's api_key does not have the flag.

		Security: a proxy that sets these headers MUST strip any
		incoming X-Contember-Client-IP / X-Contember-Client-User-Agent
		from upstream traffic and re-inject values it trusts. Without
		that, any client holding a session token minted with this flag
		could spoof its own IP/User-Agent.
		"""
		trustForwardedClientInfo: Boolean
	}

	type SignInResponse {
		ok: Boolean!
		errors: [SignInError!]! @deprecated
		error: SignInError
		result: SignInResult
	}

	type SignInError {
		code: SignInErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
		retryAfter: Int
		"""
		Set only on a MFA_ENROLLMENT_REQUIRED error: the freshly provisioned
		pending TOTP secret the client must enroll (show the QR / secret, then
		retry signIn with otpToken). Additive — clients that don't read it are
		unaffected.
		"""
		mfaEnrollment: MfaEnrollment
	}

	type MfaEnrollment {
		otpUri: String!
		otpSecret: String!
	}

	enum SignInErrorCode {
		INVALID_CREDENTIALS
		UNKNOWN_EMAIL
		INVALID_PASSWORD
		PERSON_DISABLED
		NO_PASSWORD_SET
		OTP_REQUIRED
		INVALID_OTP_TOKEN
		MFA_ENROLLMENT_REQUIRED
		EMAIL_NOT_VERIFIED
		RATE_LIMIT_EXCEEDED
	}

	type SignInResult implements CommonSignInResult {
		token: String!
		person: Person!
		"""
		Set only when this sign-in completed an MFA enrollment (A06): the freshly
		generated backup codes, shown exactly once. Null on a normal sign-in.
		"""
		backupCodes: [String!]
	}

	# == createSessionToken ==

	type CreateSessionTokenResponse {
		ok: Boolean!
		error: CreateSessionTokenError
		result: CreateSessionTokenResult
	}

	type CreateSessionTokenError {
		code: CreateSessionTokenErrorCode!
		developerMessage: String!
	}

	enum CreateSessionTokenErrorCode {
		UNKNOWN_EMAIL
		UNKNOWN_PERSON_ID
		PERSON_DISABLED
	}

	type CreateSessionTokenResult implements CommonSignInResult{
		token: String!
		person: Person!
	}

	# === signOut ===

	type SignOutResponse {
		ok: Boolean!
		errors: [SignOutError!]! @deprecated
		error: SignOutError
	}

	type SignOutError {
		code: SignOutErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum SignOutErrorCode {
		NOT_A_PERSON,
		NOT_POSSIBLE_SIGN_OUT_WITH_PERMANENT_API_KEY
	}

	# === changeProfile ===
	
	type ChangeProfileResponse {
		ok: Boolean!
		error: ChangeProfileError
	}
	
	type ChangeProfileError {
		code: ChangeProfileErrorCode!
		developerMessage: String!
	}
	
	enum ChangeProfileErrorCode {
		PERSON_NOT_FOUND
		INVALID_EMAIL_FORMAT
		EMAIL_ALREADY_EXISTS
	}
	
	# === changeMyProfile ===

	type ChangeMyProfileResponse {
		ok: Boolean!
		error: ChangeMyProfileError
	}

	type ChangeMyProfileError {
		code: ChangeMyProfileErrorCode!
		developerMessage: String!
	}

	enum ChangeMyProfileErrorCode {
		NOT_A_PERSON
		INVALID_EMAIL_FORMAT
		EMAIL_ALREADY_EXISTS
		RATE_LIMIT_EXCEEDED
	}

	# === changePassword ===

	type ChangePasswordResponse {
		ok: Boolean!
		errors: [ChangePasswordError!]! @deprecated
		error: ChangePasswordError
	}

	type ChangePasswordError {
		code: ChangePasswordErrorCode!
		weakPasswordReasons: [WeakPasswordReason!]
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum ChangePasswordErrorCode {
		PERSON_NOT_FOUND
		TOO_WEAK
	}
	
	enum WeakPasswordReason {
		TOO_SHORT
		MISSING_UPPERCASE
		MISSING_LOWERCASE
		MISSING_DIGIT
		MISSING_SPECIAL
		INVALID_PATTERN
		BLACKLISTED
		COMPROMISED
    }


	# === changeMyPassword ===
	
	type ChangeMyPasswordResponse {
		ok: Boolean!
		error: ChangeMyPasswordError
	}

	type ChangeMyPasswordError {
		code: ChangeMyPasswordErrorCode!
        weakPasswordReasons: [WeakPasswordReason!]
		developerMessage: String!
	}

	enum ChangeMyPasswordErrorCode {
		TOO_WEAK
		NOT_A_PERSON
		INVALID_PASSWORD
		NO_PASSWORD_SET
	}

	# === IDP ===

	type InitSignInIDPResponse {
		ok: Boolean!
		errors: [InitSignInIDPError!]! @deprecated
		error: InitSignInIDPError
		result: InitSignInIDPResult
	}

	type InitSignInIDPResult {
		authUrl: String!
		sessionData: Json!
		idpConfiguration: Json
	}

	type InitSignInIDPError {
		code: InitSignInIDPErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum InitSignInIDPErrorCode {
		PROVIDER_NOT_FOUND
		IDP_VALIDATION_FAILED
	}

	input IDPResponseInput {
		url: String!
	}

	type SignInIDPResponse {
		ok: Boolean!
		errors: [SignInIDPError!]! @deprecated
		error: SignInIDPError
		result: SignInIDPResult
	}

	type SignInIDPError {
		code: SignInIDPErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum SignInIDPErrorCode {
		INVALID_IDP_RESPONSE
		IDP_VALIDATION_FAILED

		PERSON_NOT_FOUND
		PERSON_DISABLED
		PERSON_ALREADY_EXISTS
	}

	type SignInIDPResult implements CommonSignInResult {
		token: String!
		person: Person!
		idpResponse: Json
	}

	type AddIDPResponse {
		error: AddIDPError
		ok: Boolean!
	}

	type AddIDPError {
		code: AddIDPErrorCode!
		developerMessage: String!
	}

	enum AddIDPErrorCode {
		ALREADY_EXISTS
		UNKNOWN_TYPE
		INVALID_CONFIGURATION
	}

	type UpdateIDPResponse {
		error: UpdateIDPError
		ok: Boolean!
	}

	type UpdateIDPError {
		code: UpdateIDPErrorCode!
		developerMessage: String!
	}

	enum UpdateIDPErrorCode {
		NOT_FOUND
		INVALID_CONFIGURATION
	}


	type DisableIDPResponse {
		error: DisableIDPError
		ok: Boolean!
	}

	type DisableIDPError {
		code: DisableIDPErrorCode!
		developerMessage: String!
	}

	enum DisableIDPErrorCode {
		NOT_FOUND
	}

	type EnableIDPResponse {
		error: EnableIDPError
		ok: Boolean!
	}

	type EnableIDPError {
		code: EnableIDPErrorCode!
		developerMessage: String!
	}

	enum EnableIDPErrorCode {
		NOT_FOUND
	}

	type IdentityProvider {
		slug: String!
		type: String!
		configuration: Json!
		disabledAt: DateTime
		options: IDPOptionsOutput!
	}

	type IDPOptionsOutput {
		autoSignUp: Boolean!
		exclusive: Boolean!
		initReturnsConfig: Boolean!
		"""
		When true, a non-exclusive provider may only auto-link to / sign in an
		existing account by e-mail if the provider asserts the e-mail is verified.
		Defaults to false.
		"""
		requireVerifiedEmail: Boolean!
	}

	input IDPOptions {
		autoSignUp: Boolean
		exclusive: Boolean
		initReturnsConfig: Boolean
		requireVerifiedEmail: Boolean
	}

	# === passwordless sign in ===
	
	type InitSignInPasswordlessResponse {
		ok: Boolean!
		error: InitSignInPasswordlessError
		result: InitSignInPasswordlessResult
	}
	
	type InitSignInPasswordlessError {
		code: InitSignInPasswordlessErrorCode!
		developerMessage: String!
	}
	
	enum InitSignInPasswordlessErrorCode {
		PERSON_NOT_FOUND

		PASSWORDLESS_DISABLED
		INVALID_CAPTCHA
		RATE_LIMIT_EXCEEDED
	}
	
	type InitSignInPasswordlessResult {
		requestId: String!
		expiresAt: DateTime!
	}

	input InitSignInPasswordlessOptions {
		mailVariant: String
		mailProject: String
	}
	
	type SignInPasswordlessResponse {
		ok: Boolean!
		error: SignInPasswordlessError
		result: SignInPasswordlessResult
	}
	
	enum PasswordlessValidationType {
		otp
		token
	}
	
	type SignInPasswordlessError {
		code: SignInPasswordlessErrorCode!
		developerMessage: String!
	}
	
	enum SignInPasswordlessErrorCode {
		TOKEN_NOT_FOUND
		TOKEN_INVALID
		TOKEN_EXPIRED
		TOKEN_USED
		PERSON_DISABLED
		OTP_REQUIRED
		INVALID_OTP_TOKEN
		MFA_ENROLLMENT_REQUIRED
	}

	type SignInPasswordlessResult implements CommonSignInResult {
		token: String!
		person: Person!
	}
	
	type ActivatePasswordlessOtpResponse {
		ok: Boolean!
		error: ActivatePasswordlessOtpError
	}
	
	type ActivatePasswordlessOtpError {
		code: ActivatePasswordlessOtpErrorCode!
		developerMessage: String!
	}
	
	enum ActivatePasswordlessOtpErrorCode {
		TOKEN_NOT_FOUND
		TOKEN_INVALID
		TOKEN_EXPIRED
		TOKEN_USED
	}
	
	type ToggleMyPasswordlessResponse {
		ok: Boolean!
		error: ToggleMyPasswordlessError
	}
	
	type ToggleMyPasswordlessError {
		code: ToggleMyPasswordlessErrorCode!
		developerMessage: String!
	}
	
	enum ToggleMyPasswordlessErrorCode {
		CANNOT_TOGGLE
        NOT_A_PERSON
	}
	

	# === invite ===

	type InviteResponse {
		ok: Boolean!
		errors: [InviteError!]! @deprecated
		error: InviteError
		result: InviteResult
	}

	type InviteError {
		code: InviteErrorCode!
		developerMessage: String!
		membershipValidation: [MembershipValidationError!]
		endUserMessage: String @deprecated
	}

	enum InviteErrorCode {
		PROJECT_NOT_FOUND
		ALREADY_MEMBER
		INVALID_MEMBERSHIP
		INVALID_EMAIL_FORMAT

		ROLE_NOT_FOUND @deprecated
		VARIABLE_NOT_FOUND @deprecated
		VARIABLE_EMPTY @deprecated
	}

	type InviteResult {
		person: Person!
		isNew: Boolean!
	}

	enum InviteMethod {
		CREATE_PASSWORD
		RESET_PASSWORD
	}

	input InviteOptions {
		method: InviteMethod
		mailVariant: String
	}

	input UnmanagedInviteOptions {
		password: String
		resetTokenHash: String
	}

	# === addProjectMember ===

	type AddProjectMemberResponse {
		ok: Boolean!
		errors: [AddProjectMemberError!]!
		error: AddProjectMemberError
	}

	type AddProjectMemberError {
		code: AddProjectMemberErrorCode!
		membershipValidation: [MembershipValidationError!]
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum AddProjectMemberErrorCode {
		PROJECT_NOT_FOUND
		IDENTITY_NOT_FOUND
		ALREADY_MEMBER
		INVALID_MEMBERSHIP

		ROLE_NOT_FOUND @deprecated
		VARIABLE_EMPTY @deprecated
		VARIABLE_NOT_FOUND @deprecated
	}

	# === updateProjectMember ===

	type UpdateProjectMemberResponse {
		ok: Boolean!
		errors: [UpdateProjectMemberError!]! @deprecated
		error: UpdateProjectMemberError
	}

	type UpdateProjectMemberError {
		code: UpdateProjectMemberErrorCode!
		developerMessage: String!
		membershipValidation: [MembershipValidationError!]
		endUserMessage: String @deprecated
	}

	enum UpdateProjectMemberErrorCode {
		PROJECT_NOT_FOUND
		NOT_MEMBER
		INVALID_MEMBERSHIP

		ROLE_NOT_FOUND @deprecated
		VARIABLE_EMPTY @deprecated
		VARIABLE_NOT_FOUND @deprecated
	}

	# === removeProjectMember ===

	type RemoveProjectMemberResponse {
		ok: Boolean!
		errors: [RemoveProjectMemberError!]!
		error: RemoveProjectMemberError
	}

	type RemoveProjectMemberError {
		code: RemoveProjectMemberErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum RemoveProjectMemberErrorCode {
		NOT_MEMBER
		PROJECT_NOT_FOUND
	}

	# === createApiKey ===

	input CreateApiKeyOptions {
		"""
		If true, the created api_key trusts X-Contember-Client-IP and
		X-Contember-Client-User-Agent headers on subsequent requests.
		Intended for backend services that proxy user requests; the customer's
		proxy must strip these headers from incoming traffic and re-inject
		them with the real user values.
		"""
		trustForwardedClientInfo: Boolean
	}

	type CreateApiKeyResponse {
		ok: Boolean!
		errors: [CreateApiKeyError!]! @deprecated
		error: CreateApiKeyError
		result: CreateApiKeyResult
	}

	type CreateApiKeyError {
		code: CreateApiKeyErrorCode!
		developerMessage: String!
		membershipValidation: [MembershipValidationError!]
		endUserMessage: String @deprecated
	}

	enum CreateApiKeyErrorCode {
		PROJECT_NOT_FOUND
		INVALID_MEMBERSHIP

		VARIABLE_NOT_FOUND @deprecated
		ROLE_NOT_FOUND @deprecated
		VARIABLE_EMPTY @deprecated
	}

	type CreateApiKeyResult {
		apiKey: ApiKeyWithToken!
	}

	# === disableApiKey ===

	type DisableApiKeyResponse {
		ok: Boolean!
		errors: [DisableApiKeyError!]! @deprecated
		error: DisableApiKeyError
	}

	type DisableApiKeyError {
		code: DisableApiKeyErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum DisableApiKeyErrorCode {
		KEY_NOT_FOUND
	}
	# === addGlobalIdentityRoles ===

	type AddGlobalIdentityRolesResponse {
		ok: Boolean!
		error: AddGlobalIdentityRolesError
		result: AddGlobalIdentityRolesResult
	}

	type AddGlobalIdentityRolesResult {
		identity: Identity!
	}
	type AddGlobalIdentityRolesError {
		code: AddGlobalIdentityRolesErrorCode!
		developerMessage: String!
	}

	enum AddGlobalIdentityRolesErrorCode {
		IDENTITY_NOT_FOUND
		INVALID_ROLE
	}


	# === removeGlobalIdentityRoles ===

	type RemoveGlobalIdentityRolesResponse {
		ok: Boolean!
		error: RemoveGlobalIdentityRolesError
		result: RemoveGlobalIdentityRolesResult
	}

	type RemoveGlobalIdentityRolesError {
		code: RemoveGlobalIdentityRolesErrorCode!
		developerMessage: String!
	}

	type RemoveGlobalIdentityRolesResult {
		identity: Identity!
	}

	enum RemoveGlobalIdentityRolesErrorCode {
		IDENTITY_NOT_FOUND
		INVALID_ROLE
	}
	# === common ===

	# === variables ===

	input VariableEntryInput {
		name: String!
		values: [String!]!
	}

	type VariableEntry {
		name: String!
		values: [String!]!
	}

	# === membership ===

	input MembershipInput {
		role: String!
		variables: [VariableEntryInput!]!
	}

	type Membership {
		role: String!
		variables: [VariableEntry!]!
	}

	type MembershipValidationError {
		code: MembershipValidationErrorCode!
		role: String!
		variable: String
	}

	enum MembershipValidationErrorCode {
		ROLE_NOT_FOUND
		VARIABLE_NOT_FOUND
		VARIABLE_EMPTY
		VARIABLE_INVALID
	}

	# === person ====

	type Person {
		id: String!
		email: String
		name: String
		otpEnabled: Boolean!
		passwordlessEnabled: Boolean
		emailVerified: Boolean!
		identity: Identity!
	}

	# === api key ===

	type ApiKey {
		id: String!
		identity: Identity!
	}

	type ApiKeyWithToken {
		id: String!
		token: String
		identity: Identity!
	}

	# === identity ===

	type Identity {
		id: String!
		description: String
		person: Person
		apiKey: ApiKey
		projects: [IdentityProjectRelation!]!
		permissions: IdentityGlobalPermissions
		roles: [String!]
		"""
		Active SESSION-type api keys for this identity. Always visible for
		the calling identity (e.g. via \`me { sessions }\`). For other identities,
		visible to callers holding the \`person:viewSessions\` permission against
		the target's roles — SUPER_ADMIN sees everyone; PROJECT_ADMIN sees
		members whose roles fall within their allowed-input-roles. Returns an
		empty list rather than throwing when the viewer lacks visibility, so
		batched identity queries do not abort on a single forbidden target.
		"""
		sessions: [SessionInfo!]!
		policies: [PolicyAssignment!]
	}

	type IdentityGlobalPermissions {
		canCreateProject: Boolean!
		canDeployEntrypoint: Boolean!
	}

	type IdentityProjectRelation {
		project: Project!
		memberships: [Membership!]!
	}

	# === project ===

	type Project {
		id: String!
		name: String!
		slug: String!
		config: Json!
		roles: [RoleDefinition!]!
		members(
			input: ProjectMembersInput,
			memberType: MemberType @deprecated(reason: "Use args")
		): [ProjectIdentityRelation!]!
	}

	input ProjectMembersInput {
		limit: Int
		offset: Int
		filter: ProjectMembersFilter
	}

	input ProjectMembersFilter {
		memberType: MemberType
		email: [String!]
		identityId: [String!]
		personId: [String!]
	}

	enum MemberType {
		API_KEY
		PERSON
	}

	type ProjectIdentityRelation {
		identity: Identity!
		memberships: [Membership!]!
	}

	type RoleDefinition {
		name: String!
		variables: [RoleVariableDefinition!]!
	}

	interface RoleVariableDefinition {
		name: String!
	}

	type RoleEntityVariableDefinition implements RoleVariableDefinition {
		name: String!
		entityName: String!
	}

	type RolePredefinedVariableDefinition implements RoleVariableDefinition {
		name: String!
		value: String!
	}

	type RoleConditionVariableDefinition implements RoleVariableDefinition {
		name: String!
	}

	# ==== 2fa ====

	type PrepareOtpResponse {
		ok: Boolean!
		result: PrepareOtpResult
	}

	type PrepareOtpResult {
		otpUri: String!
		otpSecret: String!
	}

	type ConfirmOtpResponse {
		ok: Boolean!
		errors: [ConfirmOtpError!]! @deprecated
		error: ConfirmOtpError
		result: ConfirmOtpResult
	}

	type ConfirmOtpResult {
		backupCodes: [String!]!
	}

	type ConfirmOtpError {
		code: ConfirmOtpErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum ConfirmOtpErrorCode {
		INVALID_OTP_TOKEN
		NOT_PREPARED
	}

	type DisableOtpResponse {
		ok: Boolean!
		errors: [DisableOtpError!]! @deprecated
		error: DisableOtpError
	}

	type DisableOtpError {
		code: DisableOtpErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum DisableOtpErrorCode {
		OTP_NOT_ACTIVE
		MFA_REQUIRED
	}

	type RegenerateBackupCodesResponse {
		ok: Boolean!
		error: RegenerateBackupCodesError
		result: RegenerateBackupCodesResult
	}

	type RegenerateBackupCodesError {
		code: RegenerateBackupCodesErrorCode!
		developerMessage: String!
	}

	enum RegenerateBackupCodesErrorCode {
		OTP_NOT_ACTIVE
	}

	type RegenerateBackupCodesResult {
		backupCodes: [String!]!
	}

	# ==== email otp (A05) ====

	type InitEmailOtpResponse {
		ok: Boolean!
		error: InitEmailOtpError
	}

	type InitEmailOtpError {
		code: InitEmailOtpErrorCode!
		developerMessage: String!
	}

	enum InitEmailOtpErrorCode {
		NO_EMAIL
		RATE_LIMITED
	}

	type ConfirmEmailOtpResponse {
		ok: Boolean!
		error: ConfirmEmailOtpError
		result: ConfirmEmailOtpResult
	}

	type ConfirmEmailOtpResult {
		backupCodes: [String!]!
	}

	type ConfirmEmailOtpError {
		code: ConfirmEmailOtpErrorCode!
		developerMessage: String!
	}

	enum ConfirmEmailOtpErrorCode {
		INVALID_OTP_TOKEN
	}

	type DisableEmailOtpResponse {
		ok: Boolean!
		error: DisableEmailOtpError
	}

	type DisableEmailOtpError {
		code: DisableEmailOtpErrorCode!
		developerMessage: String!
	}

	enum DisableEmailOtpErrorCode {
		EMAIL_OTP_NOT_ACTIVE
		MFA_REQUIRED
	}

	type DisablePersonResponse {
		ok: Boolean!
		error: DisablePersonError
	}

	type DisablePersonError {
		code: DisablePersonErrorCode!
		developerMessage: String!
	}

	enum DisablePersonErrorCode {
		PERSON_ALREADY_DISABLED
		PERSON_NOT_FOUND
	}

	# === forceSignOutPerson ===

	type ForceSignOutPersonResponse {
		ok: Boolean!
		error: ForceSignOutPersonError
	}

	type ForceSignOutPersonError {
		code: ForceSignOutPersonErrorCode!
		developerMessage: String!
	}

	enum ForceSignOutPersonErrorCode {
		PERSON_NOT_FOUND
	}

	# === resetPersonMfa ===

	type ResetPersonMfaResponse {
		ok: Boolean!
		error: ResetPersonMfaError
	}

	type ResetPersonMfaError {
		code: ResetPersonMfaErrorCode!
		developerMessage: String!
	}

	enum ResetPersonMfaErrorCode {
		PERSON_NOT_FOUND
	}

	# === auth policy (per-role MFA / session policy) ===

	type AuthPolicy {
		id: String!
		scope: AuthPolicyScope!
		"""Project slug, present only for project-scoped policies."""
		project: String
		roles: [String!]!
		mfaRequired: Boolean
		tokenExpiration: Interval
		idleTimeout: Interval
		mfaGraceDuration: Interval
		rememberMeAllowed: Boolean
	}

	enum AuthPolicyScope {
		global
		project
	}

	input AuthPolicyInput {
		scope: AuthPolicyScope!
		"""Project slug. Required for scope=project, forbidden for scope=global."""
		project: String
		roles: [String!]!
		mfaRequired: Boolean
		tokenExpiration: Interval
		idleTimeout: Interval
		mfaGraceDuration: Interval
		rememberMeAllowed: Boolean
	}

	type CreateAuthPolicyResponse {
		ok: Boolean!
		error: CreateAuthPolicyError
		result: CreateAuthPolicyResult
	}

	type CreateAuthPolicyResult {
		id: String!
	}

	type CreateAuthPolicyError {
		code: CreateAuthPolicyErrorCode!
		developerMessage: String!
	}

	enum CreateAuthPolicyErrorCode {
		PROJECT_REQUIRED
		PROJECT_NOT_ALLOWED
		PROJECT_NOT_FOUND
	}

	type UpdateAuthPolicyResponse {
		ok: Boolean!
		error: UpdateAuthPolicyError
	}

	type UpdateAuthPolicyError {
		code: UpdateAuthPolicyErrorCode!
		developerMessage: String!
	}

	enum UpdateAuthPolicyErrorCode {
		NOT_FOUND
		PROJECT_REQUIRED
		PROJECT_NOT_ALLOWED
		PROJECT_NOT_FOUND
	}

	type DeleteAuthPolicyResponse {
		ok: Boolean!
		error: DeleteAuthPolicyError
	}

	type DeleteAuthPolicyError {
		code: DeleteAuthPolicyErrorCode!
		developerMessage: String!
	}

	enum DeleteAuthPolicyErrorCode {
		NOT_FOUND
	}

	# === sessions ===

	type SessionInfo {
		id: String!
		createdAt: DateTime!
		expiresAt: DateTime
		lastUsedAt: DateTime
		lastIp: String
		lastUserAgent: String
		createdIp: String
		createdUserAgent: String
		isCurrent: Boolean!
		"""
		Whether this session honors X-Contember-Client-IP /
		X-Contember-Client-User-Agent headers on subsequent requests. Set when
		the session was minted via \`SignInOptions.trustForwardedClientInfo\`
		from an api_key that was itself created with the flag.
		"""
		trustForwardedClientInfo: Boolean!
	}

	type RevokeSessionResponse {
		ok: Boolean!
		error: RevokeSessionError
	}

	type RevokeSessionError {
		code: RevokeSessionErrorCode!
		developerMessage: String!
	}

	enum RevokeSessionErrorCode {
		SESSION_NOT_FOUND
		NOT_A_PERSON
	}

	# === mails ===
	
	type MailTemplateData {
		projectSlug: String
		type: MailType!
		variant: String
		subject: String!
		content: String!
		useLayout: Boolean!
		replyTo: String
	}
	
	input MailTemplate {
		projectSlug: String
		type: MailType!
		"Custom mail variant identifier, e.g. a locale."
		variant: String
		subject: String!
		content: String!
		useLayout: Boolean
		replyTo: String
	}

	enum MailType {
		EXISTING_USER_INVITED
		NEW_USER_INVITED
		RESET_PASSWORD_REQUEST
		PASSWORDLESS_SIGN_IN
		FORCED_SIGN_OUT
		EMAIL_OTP
		BACKUP_CODES_EXHAUSTED
		EMAIL_VERIFICATION
		EMAIL_CHANGE_VERIFY
		EMAIL_CHANGE_NOTIFY
	}

	input MailTemplateIdentifier {
		projectSlug: String
		type: MailType!
		variant: String
	}

	type AddMailTemplateResponse {
		ok: Boolean!
		errors: [AddMailTemplateError!]! @deprecated
		error: AddMailTemplateError
	}

	type AddMailTemplateError {
		code: AddMailTemplateErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum AddMailTemplateErrorCode {
		MISSING_VARIABLE
		PROJECT_NOT_FOUND
		INVALID_REPLY_EMAIL_FORMAT
	}

	type RemoveMailTemplateResponse {
		ok: Boolean!
		errors: [RemoveMailTemplateError!]!
		error: RemoveMailTemplateError
	}

	type RemoveMailTemplateError {
		code: RemoveMailTemplateErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum RemoveMailTemplateErrorCode {
		PROJECT_NOT_FOUND
		TEMPLATE_NOT_FOUND
	}

	# === password reset ===

	type CheckResetPasswordTokenResult {
		code: CheckResetPasswordTokenCode!
	}

	enum CheckResetPasswordTokenCode {
		REQUEST_NOT_FOUND
		TOKEN_NOT_FOUND
		TOKEN_INVALID
		TOKEN_USED
		TOKEN_EXPIRED
	}

	type CreatePasswordResetRequestResponse {
		ok: Boolean!
		errors: [CreatePasswordResetRequestError!]! @deprecated
		error: CreatePasswordResetRequestError
	}

	type CreatePasswordResetRequestError {
		code: CreatePasswordResetRequestErrorCode!
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum CreatePasswordResetRequestErrorCode {
		PERSON_NOT_FOUND
		INVALID_CAPTCHA
		RATE_LIMIT_EXCEEDED
	}

	type ResetPasswordResponse {
		ok: Boolean!
		errors: [ResetPasswordError!]! @deprecated
		error: ResetPasswordError
	}
	type ResetPasswordError {
		code: ResetPasswordErrorCode!
        weakPasswordReasons: [WeakPasswordReason!]
		developerMessage: String!
		endUserMessage: String @deprecated
	}

	enum ResetPasswordErrorCode {
		TOKEN_NOT_FOUND
		TOKEN_INVALID
		TOKEN_USED
		TOKEN_EXPIRED

		PASSWORD_TOO_WEAK
	}

	input CreateResetPasswordRequestOptions {
		mailProject: String
		mailVariant: String
	}

	# === email verification ===

	input EmailVerificationOptions {
		mailProject: String
		mailVariant: String
	}

	type RequestEmailVerificationResponse {
		ok: Boolean!
		error: RequestEmailVerificationError
	}

	type RequestEmailVerificationError {
		code: RequestEmailVerificationErrorCode!
		developerMessage: String!
	}

	enum RequestEmailVerificationErrorCode {
		RATE_LIMIT_EXCEEDED
		INVALID_CAPTCHA
	}

	type VerifyEmailResponse {
		ok: Boolean!
		error: VerifyEmailError
	}

	type VerifyEmailError {
		code: VerifyEmailErrorCode!
		developerMessage: String!
	}

	enum VerifyEmailErrorCode {
		TOKEN_NOT_FOUND
		TOKEN_INVALID
		TOKEN_USED
		TOKEN_EXPIRED
	}

	type ConfirmEmailChangeResponse {
		ok: Boolean!
		error: ConfirmEmailChangeError
	}

	type ConfirmEmailChangeError {
		code: ConfirmEmailChangeErrorCode!
		developerMessage: String!
	}

	enum ConfirmEmailChangeErrorCode {
		TOKEN_NOT_FOUND
		TOKEN_INVALID
		TOKEN_USED
		TOKEN_EXPIRED
		EMAIL_ALREADY_EXISTS
		INVALID_EMAIL_FORMAT
	}

	# === project ===

	input ProjectSecret {
		key: String!
		value: String!
	}

	input CreateProjectOptions {
		deployTokenHash: String
		noDeployToken: Boolean
	}

	type CreateProjectResponse {
		ok: Boolean!
		error: CreateProjectResponseError
		result: CreateProjectResult
	}

	type CreateProjectResponseError {
		code: CreateProjectResponseErrorCode!
		developerMessage: String!
	}

	type CreateProjectResult {
		deployerApiKey: ApiKeyWithToken
	}

	enum CreateProjectResponseErrorCode {
		ALREADY_EXISTS
		INIT_ERROR
	}

	type SetProjectSecretResponse {
		ok: Boolean!
		error: SetProjectSecretError
	}

	type SetProjectSecretError {
		code: SetProjectSecretErrorCode!
		developerMessage: String!
	}

	enum SetProjectSecretErrorCode {
		PROJECT_NOT_FOUND
	}

	type UpdateProjectResponse {
		ok: Boolean!
		error: UpdateProjectError
	}

	type UpdateProjectError {
		code: UpdateProjectErrorCode!
		developerMessage: String!
	}

	enum UpdateProjectErrorCode {
		PROJECT_NOT_FOUND
	}

	# === auth log ===

	"""
	A single \`person_auth_log\` row. Mirrors the columns described in
	docs/.../audit-log.md.
	"""
	type AuthLogEntry {
		id: String!
		createdAt: DateTime!
		"""
		One of the values listed in \`auth_log_type\` (see audit-log docs).
		Kept as String rather than a GraphQL enum because a few legacy values
		(\`2fa_enable\`, \`2fa_disable\`) start with a digit and aren't valid
		enum names, and the set is expected to keep growing.
		"""
		type: String!
		success: Boolean!
		"""
		Identity that performed the action. May be null for entries created
		before this column was populated, or when the actor's identity was
		later deleted (FK is ON DELETE SET NULL semantics-wise).
		"""
		invokedByIdentityId: String
		"""
		The actor's person (if the actor was a person, not a bare api_key).
		"""
		personId: String
		"""
		The subject of the action when different from the actor (e.g. force
		sign-out, role grant, membership change). Resolved from the affected
		identity so the trail points at the right person even when the actor
		acts on someone else's identity.
		"""
		targetPersonId: String
		"""
		Free-form input string — typically the email submitted on a failed
		login, before any person record was looked up.
		"""
		personInputIdentifier: String
		errorCode: String
		errorMessage: String
		"""
		Effective client IP after \`trust-forwarded-info\` is applied. The
		raw socket peer is preserved in \`metadata.forwarderIp\` when a
		trusted proxy was involved.
		"""
		ipAddress: String
		userAgent: String
		identityProviderId: String
		"""
		JSONB — forensic context. Common keys: \`forwarderIp\`,
		\`forwarderUserAgent\`, \`sessionId\`, \`reason\`.
		"""
		metadata: Json
		"""
		JSONB — domain payload. For change events this is typically
		\`{before, after}\`; for creation events it's the snapshot.
		Secret-bearing inputs are redacted before being stored.
		"""
		eventData: Json
	}

	"""
	All fields are AND-combined. Omitted fields are unconstrained.
	"""
	input AuthLogFilter {
		"OR-combined: any of the listed \`auth_log_type\` values matches."
		types: [String!]
		success: Boolean
		invokedByIdentityId: String
		personId: String
		targetPersonId: String
		personInputIdentifier: String
		"Inclusive lower bound (\`created_at >= createdAfter\`)."
		createdAfter: DateTime
		"Exclusive upper bound (\`created_at < createdBefore\`)."
		createdBefore: DateTime
	}

	type AuthLogPage {
		entries: [AuthLogEntry!]!
		"True when more rows exist past \`offset + limit\`."
		hasMore: Boolean!
	}

	# === policies ===

	enum PolicyEffect {
		allow
		deny
	}

	type PolicyStatement {
		effect: PolicyEffect!
		actions: [String!]!
		resources: [String!]
		""" Free-form { [operator]: { [contextPath]: primitive | [primitive] } } map. See policies.md. """
		conditions: Json
	}

	input PolicyStatementInput {
		effect: PolicyEffect!
		actions: [String!]!
		resources: [String!]
		conditions: Json
	}

	type PolicyDocument {
		version: String
		statements: [PolicyStatement!]!
	}

	input PolicyDocumentInput {
		version: String
		statements: [PolicyStatementInput!]!
	}

	type Policy {
		id: String!
		slug: String!
		label: String!
		description: String
		document: PolicyDocument!
		version: Int!
		createdAt: DateTime!
		updatedAt: DateTime!
	}

	type PolicyAssignment {
		policy: Policy!
		identityId: String!
		tags: Json!
		grantedBy: String
		grantedAt: DateTime!
	}

	type BuiltinPolicy {
		role: String!
		slug: String!
		label: String!
		description: String!
		document: PolicyDocument!
	}

	# === createPolicy ===

	input CreatePolicyInput {
		slug: String!
		label: String
		description: String
		document: PolicyDocumentInput!
	}

	type CreatePolicyResponse {
		ok: Boolean!
		error: CreatePolicyError
		result: CreatePolicyResult
	}

	type CreatePolicyError {
		code: CreatePolicyErrorCode!
		developerMessage: String!
	}

	enum CreatePolicyErrorCode {
		INVALID_SLUG
		SLUG_RESERVED
		SLUG_ALREADY_EXISTS
		INVALID_DOCUMENT
	}

	type CreatePolicyResult {
		policy: Policy!
	}

	# === updatePolicy ===

	input UpdatePolicyInput {
		label: String
		description: String
		document: PolicyDocumentInput
	}

	type UpdatePolicyResponse {
		ok: Boolean!
		error: UpdatePolicyError
		result: UpdatePolicyResult
	}

	type UpdatePolicyError {
		code: UpdatePolicyErrorCode!
		developerMessage: String!
	}

	enum UpdatePolicyErrorCode {
		POLICY_NOT_FOUND
		INVALID_DOCUMENT
	}

	type UpdatePolicyResult {
		policy: Policy!
	}

	# === deletePolicy ===

	type DeletePolicyResponse {
		ok: Boolean!
		error: DeletePolicyError
	}

	type DeletePolicyError {
		code: DeletePolicyErrorCode!
		developerMessage: String!
	}

	enum DeletePolicyErrorCode {
		POLICY_NOT_FOUND
	}

	# === assignPolicy ===

	type AssignPolicyResponse {
		ok: Boolean!
		error: AssignPolicyError
	}

	type AssignPolicyError {
		code: AssignPolicyErrorCode!
		developerMessage: String!
	}

	enum AssignPolicyErrorCode {
		POLICY_NOT_FOUND
		IDENTITY_NOT_FOUND
		INVALID_TAGS
	}

	# === revokePolicy ===

	type RevokePolicyResponse {
		ok: Boolean!
		error: RevokePolicyError
	}

	type RevokePolicyError {
		code: RevokePolicyErrorCode!
		developerMessage: String!
	}

	enum RevokePolicyErrorCode {
		POLICY_NOT_FOUND
		NOT_ASSIGNED
	}
`

export default schema
