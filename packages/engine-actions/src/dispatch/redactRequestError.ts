// scheme, optional userinfo up to the last @ of the authority, host and port, then path, query and fragment;
// a URL ends at whitespace or a quote, and starts only where a run of scheme characters starts, which keeps the scan linear
const urlPattern = /(?<![a-z\d+.-])([a-z][a-z\d+.-]*:\/\/)(?:([^\s/?#"'`<>]*)@)?([^\s/?#"'`<>]*)([^\s"'`<>]*)/gi

const redactedMarker = '[redacted]'

// fetch strips HTTP whitespace around a header value before quoting it in an error
const trimHttpWhitespace = (value: string): string => value.replace(/^[\t\n\r ]+/, '').replace(/[\t\n\r ]+$/, '')

// a server quoting the request often names only its path or query, where a token written into the target URL lives
const urlParts = (value: string): string[] => {
	let url: URL
	try {
		url = new URL(value)
	} catch {
		return []
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		return []
	}
	return [url.pathname + url.search, url.pathname, url.search, url.search.slice(1)].filter(it => it.length > 1)
}

const percentEncode = (value: string): string[] => {
	try {
		return [encodeURIComponent(value)]
	} catch {
		// a lone surrogate cannot be encoded, so it cannot be quoted encoded either
		return []
	}
}

const variantsOf = (secret: string): string[] => {
	const forms = [secret, trimHttpWhitespace(secret), ...urlParts(secret)]
	// JSON encoders may escape a slash as \/
	return [...forms, ...forms.flatMap(percentEncode), ...forms.map(it => it.replaceAll('/', '\\/'))]
}

/**
 * Removes what may carry a credential from a message about a failed webhook request, or from a target's error response:
 * every occurrence of the given secrets, also with surrounding HTTP whitespace stripped, percent-encoded or with escaped slashes,
 * the path and query of a secret URL on their own, and then the userinfo, path, query and fragment of every URL still quoted.
 * The scheme, host and port of such a URL stay for diagnostics.
 */
export const redactRequestError = (message: string, secrets: Iterable<string>): string => {
	const variants = new Set<string>()
	for (const secret of secrets) {
		for (const variant of variantsOf(secret)) {
			variants.add(variant)
		}
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
