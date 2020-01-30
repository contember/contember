export const isUrl = (url: string): boolean => {
	try {
		const urlObject = new URL(url)
		return true
	} catch {
		return false
	}
}
