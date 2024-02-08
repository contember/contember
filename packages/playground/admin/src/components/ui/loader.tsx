import * as React from 'react'
import { cn } from '../../utils/cn'
import { uic } from '../../utils/uic'
import { Loader2Icon } from 'lucide-react'

export interface LoaderProps {
	position?: 'fixed' | 'absolute' | 'static'
	size?: 'small' | 'medium' | 'large'
}

export const LoaderIcon = uic(Loader2Icon, {
	baseClass: 'animate-spin text-gray-500',
	variants: {
		size: {
			small: 'h-6 w-6',
			medium: 'h-12 w-12',
			large: 'h-24 w-24',
		},
	},
	defaultVariants: {
		size: 'large',
	},
})

export const Loader = ({ position = 'fixed', size }: LoaderProps) => {
	const [show, setShow] = React.useState(false)
	React.useEffect(() => {
		requestAnimationFrame(() => {
			setShow(true)
		})
	}, [])

	return (
		<div className={cn(
			'z-50 bg-white bg-opacity-50 backdrop-blur-sm transition-all duration-300 delay-100',
			show ? 'opacity-100' : 'opacity-0',
			position === 'fixed' && 'w-full h-full fixed top-0 left-0',
			position === 'absolute' && 'w-full h-full absolute top-0 left-0',
			position === 'static' && '',
		)}>
			<div className="flex justify-center items-center h-full w-full">
				<LoaderIcon size={size} />
			</div>
		</div>
	)
}
