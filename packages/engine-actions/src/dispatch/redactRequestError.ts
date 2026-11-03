// scheme, optional userinfo up to the last @ of the authority, host and port, then path, query and fragment;
// a URL ends at whitespace or a quote, and starts only where a run of scheme characters starts, which keeps the scan linear
const urlPattern = /(?<![a-z\d+.-])([a-z][a-z\d+.-]*:\/\/)(?:([^\s/?#"'`<>]*)@)?([^\s/?#"'`<>]*)([^\s"'`<>]*)/gi

const redactedMarker = '[redacted]'

// fetch strips HTTP whitespace around a header value before quoting it in an error
const trimHttpWhitespace = (value: string): string => value.replace(/^[\t\n\r ]+/, '').replace(/[\t\n\r ]+$/, '')

/**
 * Removes what may carry a credential from a message about a failed webhook request: every occurrence of the given secrets,
 * also with surrounding HTTP whitespace stripped, and then the userinfo, path, query and fragment of every URL it still quotes.
 * The scheme, host and port of such a URL stay for diagnostics.
 */
export const redactRequestError = (message: string, secrets: Iterable<string>): string => {
	const variants = new Set<string>()
	for (const secret of secrets) {
		variants.add(secret)
		variants.add(trimHttpWhitespace(secret))
	}
	// the longest first, so a secret containing a shorter one is not left partly visible
	const sortedSecrets = [...variants].filter(it => it !== '').sort((a, b) => b.length - a.length)
	let redacted = message
	for (const secret of sortedSecrets) {
		redacted = redacted.replaceAll(secret, redactedMarker)
	}
	return redacted.replace(urlPattern, (_, scheme: string, userinfo: string | undefined, host: string, rest: string) => {
		const redactedUserinfo = userinfo === undefined ? '' : `${redactedMarker}@`
		const redactedRest = rest === '' || rest === '/' ? rest : `/${redactedMarker}`
		return `${scheme}${redactedUserinfo}${host}${redactedRest}`
	})
}
