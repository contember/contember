import { useCallback, useEffect, useRef } from 'react'

export const useDebounceCallback = (cb: () => any, debounceMs: number) => {
	const timerRef = useRef<ReturnType<typeof setTimeout>>()
	const cbRef = useRef(cb)
	cbRef.current = cb

	useEffect(() => {
		return () => clearTimeout(timerRef.current)
	}, [])

	return useCallback(() => {
		timerRef.current && clearTimeout(timerRef.current)

		timerRef.current = setTimeout(() => {
			cbRef.current()
		}, debounceMs)
	}, [debounceMs])
}
