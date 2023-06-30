import { useScopedConsoleRef } from '@contember/react-utils'
import equal from 'fast-deep-equal/es6/index.js'
import { ContextType, ReactNode, memo, useCallback, useEffect, useMemo, useState } from 'react'
import { RegistryContext, StateContext } from './contexts'
import { RegistryContextType } from './types'

type ComponentsStateMap<V> = Map<string, V>
type StateRecord<V> = ComponentsStateMap<V>
type State<T extends Record<PropertyKey, unknown>> = Map<keyof T, StateRecord<T[keyof T]>>

export type ProviderProps = {
	value?: Record<string, unknown>;
	children: ReactNode | ((directives: ContextType<typeof StateContext>) => ReactNode);
}

export const Provider = memo<ProviderProps>(({ value, children }) => {
	const [combinedState, registry] = useProviderRegistry<Record<string, unknown>>(value)
	return (
		<RegistryContext.Provider value={registry}>
			<StateContext.Provider value={combinedState}>
				{typeof children === 'function' ? children(combinedState) : children}
			</StateContext.Provider>
		</RegistryContext.Provider>
	)
})
Provider.displayName = 'Interface.Directives.Provider'

function useProviderRegistry<T extends Record<PropertyKey, unknown>>(initialValue: Partial<T> | null | undefined): [Partial<T>, RegistryContextType<T>] {
	const [state, setState] = useState<State<T>>(new Map())
	const scopedConsole = useScopedConsoleRef('useDirectiveProviderRegistry').current

	const updateState = useCallback((
		directive: keyof T,
		updater: (previous: ComponentsStateMap<T[keyof T]>) => ComponentsStateMap<T[keyof T]>,
	) => setState(prevState => {
		const previous = prevState.get(directive) ?? new Map<string, T[keyof T]>()
		const next = updater(previous)

		scopedConsole.log('updateState', directive, { prevState, previous, next })

		if (!equal(next, previous)) {
			return new Map([...prevState, [directive, next]])
		} else {
			return prevState
		}
	}), [scopedConsole])

	const directiveRegistryApi = useMemo<RegistryContextType<T>>(() => {
		return {
			register: (directive: keyof T, component: string, value: T[keyof T]) => {
				scopedConsole.log('register', directive, component, value)
				updateState(directive, previous => {
					if (!previous.has(component)) {
						return new Map([...previous, [component, value]])
					} else {
						throw new Error(`Component "${component}" was already registered for "${String(directive)}" directive`)
					}
				})
			},
			update: (directive: keyof T, component: string, value: T[keyof T]) => {
				scopedConsole.log('update', directive, component, value)
				updateState(directive, previous => {
					if (previous.has(component)) {
						return new Map([...previous, [component, value]])
					} else {
						throw new Error(`Component "${component}" must be registered before for "${String(directive)}" directive`)
					}
				})
			},
			unregister: (directive: keyof T, component: string) => {
				scopedConsole.log('unregister', directive, component)
				updateState(directive, previous => {
					if (previous.has(component)) {
						// Allows HMR to work in dev mode
						if (import.meta.env.DEV) {
							return new Map([...previous, [component, undefined as T[keyof T]]])
						} else {
							const next = new Map(previous)
							return next.delete(component), next
						}
					} else {
						throw new Error(`Component "${component}" must be registered before for "${String(directive)}" directive`)
					}
				})
			},
		}
	}, [scopedConsole, updateState])

	const [combinedState, setCombinedState] = useState<Partial<T>>({})

	useEffect(() => {
		const nextState: Partial<T> = { ...(initialValue ?? {} as Partial<T>) }

		for (const [directive, components] of state.entries()) {
			for (const [, value] of components.entries()) {
				if (value !== undefined) {
					nextState[directive] = value
				}
			}
		}

		if (!equal(nextState, combinedState)) {
			setCombinedState(nextState)
		}
	}, [combinedState, state, initialValue])

	scopedConsole.log({ combinedState, state, initialValue })

	return [combinedState, directiveRegistryApi]
}
