import { ReactNode } from 'react'
import { EnvironmentExtensionProvider } from '@contember/react-binding'
import { identityEnvironmentExtension } from '../environment'
import { useIdentity } from '@contember/react-client-tenant'


export interface IdentityEnvironmentProviderProps {
	children: ReactNode
}

export const IdentityEnvironmentProvider: React.FC<IdentityEnvironmentProviderProps> = ({ children }) => {
	const identity = useIdentity()
	return (
		<EnvironmentExtensionProvider extension={identityEnvironmentExtension} state={identity ?? null}>
			{children}
		</EnvironmentExtensionProvider>

	)
}
