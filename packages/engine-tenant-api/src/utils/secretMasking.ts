/** What a logged secret is replaced with. */
export const REDACTED = '[redacted]'

/**
 * Argument, input field and mail variable names that hold credentials (tenant API, IdP callbacks, OIDC logout).
 * Logs and error reports keep request bodies and mails, with the values under these names masked.
 */
export const SECRET_FIELD_NAMES: ReadonlySet<string> = new Set([
	'password',
	'currentPassword',
	'newPassword',
	'passwordHash',
	'token',
	'otpToken',
	'mfaOtp',
	'otpHash',
	'otpSecret',
	'backupCode',
	'code',
	'captchaToken',
	'secret',
	'secrets',
	'clientSecret',
	'privateKey',
	'tokenHash',
	'deployTokenHash',
	'resetTokenHash',
	'sessionData',
	'accessToken',
	'access_token',
	'idToken',
	'id_token',
	'refreshToken',
	'refresh_token',
	'signedRequest',
	'logout_token',
])

/** Arguments that are secret as a whole on a given field, where their name alone is too generic. */
export const SECRET_ARGUMENTS_BY_FIELD: Readonly<Record<string, ReadonlySet<string>>> = {
	setProjectSecret: new Set(['value']),
	// The IdP callback: its URL, parameters and auth response carry authorization codes and provider tokens.
	signInIDP: new Set(['data', 'idpResponse']),
	// Actions variables typically hold webhook credentials.
	setVariables: new Set(['args']),
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Copies a decoded JSON value with every string under a secret name replaced by {@link REDACTED}.
 * With `secret`, every string in the value is replaced; other strings pass through `maskText`.
 */
export const maskSecrets = (value: unknown, secret = false, maskText: (text: string) => string = text => text): unknown => {
	if (typeof value === 'string') {
		return secret ? REDACTED : maskText(value)
	}
	if (Array.isArray(value)) {
		return value.map(item => maskSecrets(item, secret, maskText))
	}
	if (isRecord(value)) {
		return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, maskSecrets(item, secret || SECRET_FIELD_NAMES.has(key), maskText)]))
	}
	return value
}
