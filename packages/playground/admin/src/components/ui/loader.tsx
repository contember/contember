import * as React from 'react'
import { cn } from '../../utils/cn'
import { uic } from '../../utils/uic'
import { Loader2Icon } from 'lucide-react'

export interface LoaderProps {
	position?: 'fixed' | 'absolute' | 'static'
	size?: 'sm' | 'md' | 'lg'
	className?: string
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

export const Loader = ({ position = 'fixed', size, className }: LoaderProps) => {
	const [show, setShow] = React.useState(false)
	React.useEffect(() => {
		requestAnimationFrame(() => {
			setShow(true)
		})
	}, [])

	return (
		<div className={cn(
			'z-50 bg-white bg-opacity-50 backdrop-blur-sm transition-all duration-300 delay-200',
			show ? 'opacity-100' : 'opacity-0',
			position === 'fixed' && 'w-full h-full fixed top-0 left-0',
			position === 'absolute' && 'w-full h-full absolute top-0 left-0',
			position === 'static' && '',
			className,
		)}>
			<div className="flex justify-center items-center h-full w-full">
				<LoaderIcon size={size} />
			</div>
		</div>
	)
}
