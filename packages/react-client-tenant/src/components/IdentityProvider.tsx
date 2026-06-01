import { useSessionToken } from '@contember/react-client'
import { ReactNode, useEffect } from 'react'
import { useFetchIdentity } from '../hooks/index.js'
import { IdentityContext, IdentityMethodsContext, IdentityStateContext } from '../contexts.js'

export interface IdentityProviderProps {
	children: ReactNode
}

export const IdentityProvider: React.FC<IdentityProviderProps> = ({ children }) => {
	const sessionToken = useSessionToken()
	const [{ identity, state }, methods] = useFetchIdentity()

	const { refreshIdentity, clearIdentity } = methods
	useEffect(() => {
		if (sessionToken !== undefined) {
			refreshIdentity()
		}
	}, [sessionToken, refreshIdentity])

	const hasIdentity = identity !== undefined
	useEffect(() => {
		if (sessionToken === undefined && hasIdentity) {
			clearIdentity()
		}
	}, [sessionToken, clearIdentity, hasIdentity])

	return (
		<IdentityStateContext.Provider value={state}>
			<IdentityContext.Provider value={identity}>
				<IdentityMethodsContext.Provider value={methods}>
					{children}
				</IdentityMethodsContext.Provider>
			</IdentityContext.Provider>
		</IdentityStateContext.Provider>
	)
}
