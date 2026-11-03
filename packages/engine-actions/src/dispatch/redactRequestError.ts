// scheme, optional userinfo, host and port, then path, query and fragment; a URL in a message ends at whitespace or a quote
const urlPattern = /\b([a-z][a-z\d+.-]*:\/\/)(?:([^\s/?#@"'`<>]*)@)?([^\s/?#"'`<>]*)([^\s"'`<>]*)/gi

const redactedMarker = '[redacted]'

/**
 * Removes what may carry a credential from a message about a failed webhook request: the userinfo, path, query and fragment
 * of every URL it quotes, and every occurrence of the given secrets. The scheme, host and port stay for diagnostics.
 */
export const redactRequestError = (message: string, secrets: Iterable<string>): string => {
	let redacted = message.replace(urlPattern, (_, scheme: string, userinfo: string | undefined, host: string, rest: string) => {
		const redactedUserinfo = userinfo === undefined ? '' : `${redactedMarker}@`
		const redactedRest = rest === '' || rest === '/' ? rest : `/${redactedMarker}`
		return `${scheme}${redactedUserinfo}${host}${redactedRest}`
	})
	// the longest first, so a secret containing a shorter one is not left partly visible
	const sortedSecrets = [...new Set(secrets)].filter(it => it !== '').sort((a, b) => b.length - a.length)
	for (const secret of sortedSecrets) {
		redacted = redacted.replaceAll(secret, redactedMarker)
	}
	return redacted
}
