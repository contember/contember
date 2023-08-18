import deepEqual from 'fast-deep-equal/es6/index.js'
import { useEffect, useRef } from 'react'

export function useReferentiallyStableValue<T>(value: T): T {
	const ref = useRef(value)

	useEffect(() => {
		if (!deepEqual(ref.current, value)) {
			ref.current = value
		}
	}, [value])

	return ref.current = value
}
