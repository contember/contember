import { Slot } from '@radix-ui/react-slot'
import { ComponentType, ReactElement } from 'react'
import { useIDPMethods } from '../../contexts'

const SlotButton = Slot as ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>

export interface IDPInitTriggerProps {
	children: ReactElement
	identityProvider: string
}

export const IDPInitTrigger = ({ identityProvider, ...props }: IDPInitTriggerProps) => {
	const initIdp = useIDPMethods().initRedirect
	return (
		<SlotButton onClick={() => initIdp({ provider: identityProvider })}  {...props} />
	)
}
