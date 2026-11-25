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
	const [fetchAbortController, setFetchAbortController] = useState(() => new AbortController())
	const [{ identity, state }, methods] = useFetchIdentity({ signal: fetchAbortController.signal })

	// Back to a page kept in the back-forward cache after the redirect: a new signal refreshes the identity below.
	useEffect(() => {
		const onPageShow = (event: PageTransitionEvent) => {
			if (event.persisted && fetchAbortController.signal.aborted) {
				setFetchAbortController(new AbortController())
			}
		}
		window.addEventListener('pageshow', onPageShow)
		return () => window.removeEventListener('pageshow', onPageShow)
	}, [fetchAbortController])

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
