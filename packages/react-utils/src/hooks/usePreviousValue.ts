import { useRef, useEffect } from 'react'

export const usePreviousValue = <Value>(value: Value) => {
	const ref = useRef<Value>(value)
	useEffect(() => {
		ref.current = value
	})
	return ref.current
}
