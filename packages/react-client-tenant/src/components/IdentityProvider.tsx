import { useSessionToken } from '@contember/react-client'
import { ReactNode, useEffect, useState } from 'react'
import { useFetchIdentity } from '../hooks/index.js'
import { IdentityContext, IdentityMethodsContext, IdentityStateContext } from '../contexts.js'
import { IdentityFetchAbortControllerContext } from '../internal/contexts.js'

export interface IdentityProviderProps {
	children: ReactNode
}

export const IdentityProvider: React.FC<IdentityProviderProps> = ({ children }) => {
	const sessionToken = useSessionToken()
	// Aborted by a redirect to the backlink, which also cancels a `me` query that starts after it.
	const [fetchAbortController] = useState(() => new AbortController())
	const [{ identity, state }, methods] = useFetchIdentity({ signal: fetchAbortController.signal })

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
					<IdentityFetchAbortControllerContext.Provider value={fetchAbortController}>
						{children}
					</IdentityFetchAbortControllerContext.Provider>
				</IdentityMethodsContext.Provider>
			</IdentityContext.Provider>
		</IdentityStateContext.Provider>
	)
}
