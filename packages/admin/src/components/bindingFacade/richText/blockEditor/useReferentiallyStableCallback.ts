import { useCallback, useEffect, useRef } from 'react'

export const useReferentiallyStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
	const ref = useRef(callback)
	useEffect(() => {
		ref.current = callback
	}, [callback])
	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useCallback<T>(((...args: any[]) => {
		return ref.current(...args)
	}) as T, [])
}
