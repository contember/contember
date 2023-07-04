import { RequiredDeepPlainObject, assert, isNonEmptyTrimmedString } from '@contember/utilities'
import { memo, useContext, useId, useLayoutEffect, useRef } from 'react'
import { RegistryContext } from './contexts'

export type DirectiveProps<T> = { [K in keyof T]: { name: K, content: T[K] } }[keyof T]

export interface DirectiveComponentType<
	T extends Record<string, unknown> = Record<string, unknown>,
> extends React.ExoticComponent<DirectiveProps<RequiredDeepPlainObject<T>>> {
	displayName?: string | undefined;
}

export function useDirectiveLifecycle<
	T extends RequiredDeepPlainObject,
	K extends keyof T,
	V extends T[K],
>(
	name: K,
	content: V,
) {
	assert('name is non-empty string', name, isNonEmptyTrimmedString)
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

export const Directive: DirectiveComponentType<RequiredDeepPlainObject> = memo<DirectiveProps<Record<string, unknown>>>(({ name, content }) => {
	useDirectiveLifecycle(name, content)

	return null
})
Directive.displayName = 'Interface.Directives.Directive'
