import deepEqual from 'deep-equal'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useScopedConsoleRef } from '../debug-context'
import { RefObjectOrElement, unwrapRefValue } from './unwrapRefValue'

export function useOnElementMutation(
	refOrElement: RefObjectOrElement<HTMLElement | undefined>,
	callback: MutationCallback,
	options: MutationObserverInit = { attributes: true, childList: true, subtree: true },
) {
	const scopedConsoleRef = useScopedConsoleRef('useOnElementMutation')

	const callbackRef = useRef(callback); callbackRef.current = callback
	const optionsRef = useRef<MutationObserverInit>(options); optionsRef.current = options

	const [optionsState, setOptionsState] = useState<MutationObserverInit>(options)

	useEffect(() => {
		if (!deepEqual(optionsRef.current, options)) {
			setOptionsState(options)
		}
	}, [options])

	useLayoutEffect(() => {
		const element = unwrapRefValue(refOrElement)

		if (element) {
			function handler(mutations: MutationRecord[], observer: MutationObserver) {
				scopedConsoleRef.current.logged('element.mutations', mutations)
				callbackRef.current(mutations, observer)
			}

			const observer = new MutationObserver(handler)

			observer.observe(element, optionsState)

			return () => {
				observer.disconnect()
			}
		}
	}, [optionsState, refOrElement, scopedConsoleRef])
}
