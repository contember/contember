import { createContext } from 'react'

export interface SessionTokenContextValue {
	propsToken: string | undefined
	source: 'props' | 'localstorage' | undefined
	token: string | undefined
}

export const SessionTokenContext = createContext<SessionTokenContextValue>({
	propsToken: undefined,
	source: undefined,
	token: undefined,
})
