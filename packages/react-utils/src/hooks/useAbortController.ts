import { useCallback, useRef } from 'react'

export const useAbortController = () => {
	const lastAbortControllerRef = useRef<AbortController | undefined>(undefined)
	return useCallback((): AbortSignal => {
		lastAbortControllerRef.current?.abort()

		const newController = new AbortController()
		lastAbortControllerRef.current = newController
		return newController.signal
	}, [])
}
