import { JsonValue } from '@contember/react-binding'
import { useCallback } from 'react'

export type IDPState = { provider: string, sessionData: JsonValue }

export const useIDPStateStore = (): {get: () => IDPState | null, set: (state: IDPState) => void} => {
	return {
		get: useCallback(() => {
			const item = sessionStorage.getItem('idp')
			if (!item) {
				return null
			}
			return JSON.parse(item)
		}, []),
		set: useCallback((state: IDPState) => {
			sessionStorage.setItem('idp', JSON.stringify(state))
		}, []),
	}
}
