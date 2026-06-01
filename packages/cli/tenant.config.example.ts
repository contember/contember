import { defineTenantConfig } from '@contember/cli'

/**
 * Example tenant configuration. Copy to `tenant.config.ts` and run:
 *
 *   contember tenant:apply --dsn "contember://app:TOKEN@api.example.com"
 *   contember tenant:apply tenant.config.ts --dry-run
 *
 * The token must have PROJECT_ADMIN/SUPER_ADMIN privileges (a deploy-only
 * token is not sufficient). Applying is idempotent and never removes entries.
 */
export default defineTenantConfig({
	config: {
		password: {
			minLength: 8,
			requireUppercase: 1,
			requireLowercase: 1,
			requireDigit: 1,
			checkHibp: true,
		},
		login: {
			defaultTokenExpiration: 'P1D',
			maxTokenExpiration: 'P2D',
			revealUserExists: false,
		},
		passwordless: {
			enabled: 'optIn',
			expiration: 'PT5M',
		},
		captcha: {
			provider: 'turnstile',
			secret: process.env.TURNSTILE_SECRET,
			threshold: 0.5,
		},
		rateLimits: {
			loginPerIp: { limit: 10, window: 'PT1M' },
		},
	},

	identityProviders: {
		google: {
			type: 'oidc',
			configuration: {
				clientId: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				url: 'https://accounts.google.com',
			},
			options: {
				autoSignUp: true,
				exclusive: false,
			},
			disabled: false,
		},
	},

	mailTemplates: [
		{
			type: 'RESET_PASSWORD_REQUEST',
			variant: 'cs',
			subject: 'Obnovení hesla',
			content: 'Klikněte na odkaz pro obnovení hesla: {{link}}',
		},
	],
})
