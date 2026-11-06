export const RateLimitScopes = {
	signUpPerIp: 'sign_up_per_ip',
	loginPerIp: 'login_per_ip',
	passwordResetPerIp: 'password_reset_per_ip',
	passwordlessInitPerIp: 'passwordless_init_per_ip',
	emailOtpPerPerson: 'email_otp_per_person',
	emailVerificationPerIp: 'email_verification_per_ip',
	reauthenticationPerPerson: 'reauthentication_per_person',
} as const

export type RateLimitScope = typeof RateLimitScopes[keyof typeof RateLimitScopes]

/** Scopes whose limit and window come from the tenant configuration. */
export type ConfiguredRateLimitScope = Exclude<RateLimitScope, typeof RateLimitScopes.reauthenticationPerPerson>
