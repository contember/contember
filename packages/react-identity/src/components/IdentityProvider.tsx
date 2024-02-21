import { useSessionToken } from '@contember/react-client'
import { ReactNode, useEffect } from 'react'
import { EnvironmentExtensionProvider } from '@contember/react-binding'
import { useFetchIdentity } from '../hooks'
import { IdentityContext, IdentityMethodsContext, IdentityStateContext } from '../internal/contexts'
import { identityEnvironmentExtension } from '../environment/IdentityEnvironmentExtension'


export interface IdentityProviderProps {
	children: ReactNode
}

export const IdentityProvider: React.FC<IdentityProviderProps> = ({ children }) => {
	const sessionToken = useSessionToken()
	const [{ identity, state }, methods] = useFetchIdentity()

	const { refreshIdentity, clearIdentity } = methods
	useEffect(
		() => {
			if (sessionToken !== undefined) {
				refreshIdentity()
			} else {
				clearIdentity()
			}
		},
		[sessionToken, refreshIdentity, clearIdentity],
	)

	return (
		<IdentityStateContext.Provider value={state}>
			<IdentityContext.Provider value={identity}>
				<IdentityMethodsContext.Provider value={methods}>
					<EnvironmentExtensionProvider extension={identityEnvironmentExtension} state={identity ?? null}>
						{children}
					</EnvironmentExtensionProvider>
				</IdentityMethodsContext.Provider>
			</IdentityContext.Provider>
		</IdentityStateContext.Provider>
	)
}
