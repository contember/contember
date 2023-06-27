import { ComponentClassNameProps } from '@contember/utilities'
import { ReactNode } from 'react'
import { Size } from '../../types'

export type SpinnerOverlayProps = ComponentClassNameProps & {
	size?: Size;
}

export interface SpinnerContainerProps extends SpinnerOverlayProps {
	enabled?: boolean;
	children: ReactNode;
}
