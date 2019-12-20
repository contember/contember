export const invokeIfSupportsCredentials = async function(callback: () => void) {
	if ('credentials' in navigator && 'PasswordCredential' in window) {
		try {
			await callback()
		} catch (error) {
			// Fail silently/don't alert user - non-critical feature
			console.error(error)
		}
	}
}
