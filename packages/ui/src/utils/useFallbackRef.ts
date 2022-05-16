import { ForwardedRef, useRef } from 'react'

export function useFallbackRef<E extends HTMLDivElement>(forwardedRef?: ForwardedRef<E>) {
	const innerRef = useRef<E>(null)

	return forwardedRef ?? innerRef
}
