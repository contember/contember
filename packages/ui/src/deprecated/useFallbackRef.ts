import { deprecate } from '@contember/utilities'
import { ForwardedRef, useRef } from 'react'

/** @deprecated Use `import { useComposeRef } from '@contember/react-utils'` instead */
export function useFallbackRef<E extends HTMLDivElement>(forwardedRef?: ForwardedRef<E>) {
	deprecate('1.4.0', true, 'useFallbackRef', `import { useComposeRef } from '@contember/react-utils'`)
	const innerRef = useRef<E>(null)

	return forwardedRef ?? innerRef
}
