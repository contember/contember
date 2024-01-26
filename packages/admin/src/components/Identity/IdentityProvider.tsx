import { Message, SpinnerOverlay } from '@contember/ui'
import { ReactNode, useEffect } from 'react'
import { MiscPageLayout } from '../MiscPageLayout'
import { InvalidIdentityFallback } from './InvalidIdentityFallback'
import { IdentityProvider as BaseIdentityProvider, IdentityState } from '@contember/react-identity'

export interface IdentityProviderProps {
	children: ReactNode
	onInvalidIdentity?: () => void
	allowUnauthenticated?: boolean
}

const ClearIdentityHandler = ({ onInvalidIdentity }: {
	onInvalidIdentity?: () => void
}) => {
	useEffect(() => {
		if (onInvalidIdentity) {
			onInvalidIdentity()
		} else if (window.location.pathname !== '/') {
			window.location.href = '/' // todo better redirect?
		}
	}, [onInvalidIdentity])

	return null
}


export const IdentityProvider: React.FC<IdentityProviderProps> = ({ children, onInvalidIdentity, allowUnauthenticated }) => {
	return (
		<BaseIdentityProvider>
			<IdentityState state={'cleared'}>
				<ClearIdentityHandler onInvalidIdentity={onInvalidIdentity}/>
				<MiscPageLayout>
					<Message size="large" padding="large" display="block">Logging out&hellip;</Message>
				</MiscPageLayout>
			</IdentityState>
			<IdentityState state={'failed'}>
				<InvalidIdentityFallback />
			</IdentityState>
			<IdentityState state={allowUnauthenticated ? 'loading' : ['loading', 'none']}>
				<SpinnerOverlay />
			</IdentityState>
			<IdentityState state={allowUnauthenticated ? ['success', 'none'] : 'success'}>
				{children}
			</IdentityState>
		</BaseIdentityProvider>
	)
}
