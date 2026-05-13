export const RateLimitScopes = {
	signUpPerIp: 'sign_up_per_ip',
	passwordResetPerIp: 'password_reset_per_ip',
	passwordlessInitPerIp: 'passwordless_init_per_ip',
	passwordResetMailPerEmail: 'password_reset_mail_per_email',
	passwordlessInitMailPerEmail: 'passwordless_init_mail_per_email',
} as const

export type RateLimitScope = typeof RateLimitScopes[keyof typeof RateLimitScopes]
