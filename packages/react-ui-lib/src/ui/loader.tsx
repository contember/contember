import * as React from 'react'
import { uic } from '../utils'
import { Loader2Icon } from 'lucide-react'
import { Overlay, OverlayProps } from './overlay'

export interface LoaderProps extends Omit<OverlayProps, 'children'> {
	size?: 'sm' | 'md' | 'lg'
}

export const LoaderIcon = uic(Loader2Icon, {
	baseClass: 'animate-spin text-gray-500',
	variants: {
		size: {
			sm: 'h-6 w-6',
			md: 'h-12 w-12',
			lg: 'h-24 w-24',
		},
	},
	defaultVariants: {
		size: 'lg',
	},
})

export const Loader = ({  size, ...props }: LoaderProps) => {
	return (
		<Overlay {...props}>
			<LoaderIcon size={size} />
		</Overlay>
	)
}
