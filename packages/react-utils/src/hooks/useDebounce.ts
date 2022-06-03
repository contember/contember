import { useEffect, useState } from 'react'

export const useDebounce = <T>(value: T, debounceMs: number): T => {
	const [debounced, setDebounced] = useState(value)
	useEffect(() => {
		const handle = window.setTimeout(() => setDebounced(value), debounceMs)
		return () => {
			window.clearTimeout(handle)
		}
	}, [value, debounceMs])
	return debounced
}
