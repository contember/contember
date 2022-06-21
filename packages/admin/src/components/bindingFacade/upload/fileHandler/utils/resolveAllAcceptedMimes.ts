export const resolveAllAcceptedMimes = (inputMimes: (string | null)[]): string[] | null => {
	const mimes = new Set<string>()
	for (const mime of inputMimes) {
		if (mime === null || mime === '*' || mime === '*/*') {
			return null
		}
		mimes.add(mime)
	}
	return Array.from(mimes)
}
