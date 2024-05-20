export const getBaseHref = () => {
	const href = window.location.href
	return href.includes('?') ? href.slice(0, href.indexOf('?')) : href
}
