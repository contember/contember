export const isUrl = (url: string): boolean => {
	if (url.length < 4) {
		// This is almost definitely not an url anyway.
		// By returning early, we avoid the relatively costly URL constructor and can speed up the most common case of
		// just inserting a single character which better be as fast as possible.
		return false
	}
	try {
		const urlObject = new URL(url)
		return true
	} catch {
		return false
	}
}
