import { useCallback, useEffect } from 'react'
import { useIdentity } from '../../contexts.js'
import { useIdentityFetchAbortController } from '../contexts.js'

const getBacklinkFromUrl = () => {
	return new URLSearchParams(window.location.search).get('backlink')
}

export const useSaveBacklink = ({ storage = 'session' }: {
	storage?: 'session' | 'local'
} = {}) => {
	return useCallback(() => {
		const backlink = getBacklinkFromUrl()
		if (!backlink) {
			return
		}
		if (storage === 'local') {
			localStorage.setItem('backlink', backlink)
		} else {
			sessionStorage.setItem('backlink', backlink)
		}
	}, [storage])
}

export const useRedirectToBacklinkCallback = () => {
	const identityFetchAbortController = useIdentityFetchAbortController()
	return useCallback(() => {
		const backlink = getBacklinkFromUrl() ?? sessionStorage.getItem('backlink') ?? localStorage.getItem('backlink')
		if (!backlink) {
			return
		}
		sessionStorage.removeItem('backlink')
		localStorage.removeItem('backlink')
		const resolvedBacklink = new URL(backlink, window.location.href)
		if (resolvedBacklink.origin === window.location.origin) {
			// The navigation would cancel the `me` query a new session token starts, as a plain network error.
			identityFetchAbortController?.abort()
			window.location.href = resolvedBacklink.toString()
		}
	}, [identityFetchAbortController])
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
