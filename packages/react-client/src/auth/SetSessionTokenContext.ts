import { createContext } from 'react'

export const SetSessionTokenContext = createContext<(token: string | undefined) => void>(() => {
	throw new Error('SetSessionTokenContext is not set')
})
