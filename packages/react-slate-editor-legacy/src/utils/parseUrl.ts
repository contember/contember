export const parseUrl = (url: string): URL | undefined => {
	if (url.length < 4 || url.includes(' ')) {
		// This is almost definitely not an url anyway.
		// By returning early, we avoid the relatively costly URL constructor and can speed up the most common case of
		// just inserting a single character which better be as fast as possible.
		return undefined
	}
	try {
		return new URL(url)
	} catch {
		return undefined
	}
}
