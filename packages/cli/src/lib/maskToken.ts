const recognizableToken = /^[A-Za-z0-9._~-]{12,}$/

/** Keeps a small fingerprint for recognizable credentials and hides every other value completely. */
export const maskToken = (token: string): string => {
	if (!recognizableToken.test(token)) {
		return '***'
	}
	return `${token.slice(0, 3)}***${token.slice(-3)}`
}
