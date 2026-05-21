export const RateLimitScopes = {
	signUpPerIp: 'sign_up_per_ip',
	loginPerIp: 'login_per_ip',
	passwordResetPerIp: 'password_reset_per_ip',
	passwordlessInitPerIp: 'passwordless_init_per_ip',
} as const

export type RateLimitScope = typeof RateLimitScopes[keyof typeof RateLimitScopes]
