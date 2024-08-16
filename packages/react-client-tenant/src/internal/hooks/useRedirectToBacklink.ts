import { useCallback, useEffect } from 'react'
import { useIdentity } from '../../contexts'

const getBacklinkFromUrl = () => {
	return new URLSearchParams(window.location.search).get('backlink')
}

export const useSaveBacklink = () => {
	return useCallback(() => {
		const backlink = getBacklinkFromUrl()
		if (!backlink) {
			return
		}
		sessionStorage.setItem('backlink', backlink)
	}, [])
}

export const useRedirectToBacklinkCallback = () => {
	return useCallback(() => {
		const backlink = getBacklinkFromUrl() ?? sessionStorage.getItem('backlink')
		if (!backlink) {
			return
		}
		sessionStorage.removeItem('backlink')
		const resolvedBacklink = new URL(backlink, window.location.href)
		if (resolvedBacklink.origin === window.location.origin) {
			window.location.href = resolvedBacklink.toString()
		}
	}, [])
}

export const useRedirectToBacklink = () => {
	const identity = useIdentity()
	const redirect = useRedirectToBacklinkCallback()
	useEffect(() => {
		if (!identity) {
			return
		}
		redirect()
	}, [identity, redirect])

}
