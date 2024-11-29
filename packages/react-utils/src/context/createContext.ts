import type { Context, Provider } from 'react'
import { createContext as baseCreateContext, useContext } from 'react'

export function createContext<T>(name: string, initialValue: T): [Context<T>, () => T, Provider<T>] {
	const OptionalContext = baseCreateContext<T>(initialValue)
	OptionalContext.displayName = name

	return [OptionalContext, () => useContext(OptionalContext), OptionalContext.Provider]
}
