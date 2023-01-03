import { Button } from '@contember/ui'
import { IDP } from './common'
import { useInitIDPRedirect, UseInitIDPRedirectProps } from './useInitIDPRedirect'

export interface IDPInitButtonProps {
	provider: IDP,
	onError: UseInitIDPRedirectProps['onError']
}

export const IDPInitButton = ({ provider, onError }: IDPInitButtonProps) => {
	const onInitIDP = useInitIDPRedirect({ onError })

	return (
		<Button onClick={() => onInitIDP(provider)}>Login using {provider.name ?? provider.provider}</Button>
	)
}
