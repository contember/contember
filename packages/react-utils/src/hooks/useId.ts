import { useMemo, useRef } from 'react'

const count = { current: 360 }

function nextId() {
	count.current += 1

	return `:${count.current.toString(36)}:`
}

/**
 * Returns a unique ID string
 * @internal
 *
 * NOTE: This hook is a temporary solution until we stop supporting React < 18
 *
 * @returns a unique id
 */
export function useId() {
	return useMemo(() => nextId(), [])
}
