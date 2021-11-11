import { useCallback, useRef } from 'react'

export const useReferentiallyStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
	const ref = useRef(callback)
	ref.current = callback
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useCallback<T>(((...args: any[]) => {
		return ref.current(...args)
	}) as T, [])
}
