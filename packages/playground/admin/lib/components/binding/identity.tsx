import { IdentityState } from '@contember/react-identity'
import { Loader } from '../ui/loader'
import { dict } from '../../../lib/dict'

export const IdentityLoader = ({ children }: {
	children: React.ReactNode
}) => {
	return <>
		<IdentityState state={['loading', 'none', 'cleared']}>
			<Loader />
		</IdentityState>
		<IdentityState state={'failed'}>
			{dict.identityLoader.fail}
		</IdentityState>
		<IdentityState state={'success'}>
			{children}
		</IdentityState>
	</>
}
