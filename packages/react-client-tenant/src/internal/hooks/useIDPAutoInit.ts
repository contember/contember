import { useMemo } from 'react'

export const useIDPAutoInitProvider = () => {
	return useMemo(() => {
		const params = new URLSearchParams(window.location.search)
		const idp = params.get('idp')
		if (idp !== null) {
			return idp
		}
		const backlink = params.get('backlink')

		if (backlink !== null) {
			const resolvedBacklink = new URL(backlink, window.location.href)
			return resolvedBacklink.searchParams.get('idp')
		}
	}, [])
}

