import { MutableRefObject, RefCallback, useMemo, useRef } from 'react'

type MaybeRef<T> = ((instance: T | null) => void) | MutableRefObject<T | null> | null | undefined
type ComposedRefCallback<T> = RefCallback<T> & { current: T | null };

function setRef<T>(ref: MaybeRef<T>, instance: T | null): void {
	if (ref) {
		if (typeof ref === 'function') {
			ref(instance)
		} else if (instance) {
			ref.current = instance
		}
	}
}

/**
 * Fills any number of refs with an instance
 *
 * Useful when you need to use outer ref and inner in the same time, e.g. passing element
 * back to forwardedRef an also using the same value within the component locally.
 *
 * @param refs Rest parameter of refs to fill with instance
 * @returns Returns a function similar to a RefCallback
 */
export function useComposeRef<T>(...refs: MaybeRef<T>[]): ComposedRefCallback<T> {
	const initialRefs = useRef(refs)

	const composeRef: ComposedRefCallback<T> = useMemo(() => {
		function composedRefCallback(instance: T | null) {
			initialRefs.current.forEach(ref => setRef(ref, instance))
			setCurrent(instance)
		}

		function setCurrent(instance: T | null) {
			if (instance) {
				composedRefCallback.current = instance
			}
		}

		composedRefCallback.current = null as T | null

		return composedRefCallback
	}, [])

	return composeRef
}
