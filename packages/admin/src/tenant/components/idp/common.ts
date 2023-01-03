export const getBaseHref = () => {
	const href = window.location.href
	return href.includes('?') ? href.slice(0, href.indexOf('?')) : href
}


export const IDP_BACKLINK = 'idp_backlink'


export interface IDP {
	provider: string
	name?: string
}
