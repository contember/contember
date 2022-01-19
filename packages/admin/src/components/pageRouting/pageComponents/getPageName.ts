const fail = () => {
	throw new Error('Page name is not defined')
}
export const getPageName = ({ pageName }: { pageName?: string }, fallback?: string): string => {
	return pageName ?? fallback ?? fail()
}
