export const isDevMode = () => {
	const hostname = location.hostname.toLowerCase()
	return hostname === 'localhost'
}
