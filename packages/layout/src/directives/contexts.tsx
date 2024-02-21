import { createContext } from '@contember/react-utils'
import { RegistryContextType } from './types'

const StateContextInternal = createContext<Record<string, unknown>>('Interface.Directives.StateContext', {})
export const StateContext = StateContextInternal[0]
export const useDirectives = StateContextInternal[1] as <T extends Record<string, unknown>>() => T

export const [RegistryContext, useRegistryContext] = createContext<RegistryContextType<Record<string, unknown>>>('Interface.Directives.RegistryContext', {
	register: undefined,
	unregister: undefined,
	update: undefined,
})
