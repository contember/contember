import { IdentityState } from '@contember/react-identity'
import { Loader } from './ui/loader'

export const IdentityLoader = ({ children }: {
	children: React.ReactNode
}) => {
	return <>
		<IdentityState state={['loading', 'none', 'cleared']}>
			<Loader />
		</IdentityState>
		<IdentityState state={'failed'}>
			Failed to fetch identity
		</IdentityState>
		<IdentityState state={'success'}>
			{children}
		</IdentityState>
	</>
}
