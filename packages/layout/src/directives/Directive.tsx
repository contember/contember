import { useId } from '@contember/react-utils'
import { memo, useContext, useLayoutEffect, useRef } from 'react'
import { RegistryContext } from './contexts'

export type DirectiveProps<T> = { [K in keyof T]: { name: K, content: T[K] } }[keyof T]

export type DirectiveComponentType<T extends Record<string, unknown> = Record<string, unknown>> =
	& React.ExoticComponent<DirectiveProps<T>>
	& {
		displayName?: string | undefined;
	}

export function useDirectiveLifecycle<
	T extends Record<string, unknown>,
	K extends keyof T & string,
	V extends T[K],
>(
	name: K,
	content: V,
) {
	const { update, register, unregister } = useContext(RegistryContext)

	const directiveId = useRef(`Directive(${name}):${useId()}`)
	const isRegistered = useRef(false)

	useLayoutEffect(() => {
		if (update && register && unregister) {
			const id = directiveId.current

			if (isRegistered.current) {
				update(name, id, content as any)
			} else {
				register(name, id, content as any)
				isRegistered.current = true
			}

			return () => {
				unregister(name, id)
			}
		}
	}, [name, content, update, register, unregister])

	return isRegistered.current
}

/**
 * @group Layout
 */
export const Directive: DirectiveComponentType = memo<DirectiveProps<Record<string, unknown>>>(({ name, content }) => {
	useDirectiveLifecycle(name, content)

	return null
})
Directive.displayName = 'Interface.Directives.Directive'
