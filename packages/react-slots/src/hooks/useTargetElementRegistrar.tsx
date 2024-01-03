import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTargetsRegistryContext } from '../internal/contexts'
import { useId } from '@contember/react-utils'

/**
 * Returns a function that registers the given element as a target for the given slot name.
 * You should use it in the `ref` prop of the element you want to register.
 */
export const useTargetElementRegistrar = (name: string, aliases?: string[]): ((element: HTMLElement | null) => void) => {
	const id = useId()
	const [element, setElement] = useState<HTMLElement | null>(null)
	const { unregisterSlotTarget, registerSlotTarget } = useTargetsRegistryContext()

	useLayoutEffect(() => {
		if (!element) {
			return
		}
		return registerSlotTarget(id, name, element)
	}, [element, id, name, registerSlotTarget])

	const registeredAliasesRef = useRef<Set<string>>(new Set())

	useLayoutEffect(() => {
		if (!element || !aliases?.length) {
			return
		}

		aliases.forEach(name => {
			if (!registeredAliasesRef.current.has(name)) {
				registerSlotTarget(id, name, element)
				registeredAliasesRef.current.add(name)
			}
		})

		registeredAliasesRef.current.forEach(name => {
			if (!aliases.includes(name)) {
				unregisterSlotTarget(id, name)
				registeredAliasesRef.current.delete(name)
			}
		})
	}, [aliases, element, id, registerSlotTarget, unregisterSlotTarget])

	useEffect(() => {
		return () => {
			registeredAliasesRef.current.forEach(name => {
				unregisterSlotTarget(id, name)
			})
			registeredAliasesRef.current = new Set()
		}
	}, [id, unregisterSlotTarget])

	return setElement
}
