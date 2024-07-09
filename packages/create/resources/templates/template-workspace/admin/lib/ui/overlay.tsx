import * as React from 'react'
import { cn } from '../utils'

export interface OverlayProps {
	position?: 'fixed' | 'absolute' | 'static'
	className?: string
	children?: React.ReactNode
	showImmediately?: boolean
}

export const Overlay = ({ position = 'fixed',  className, children, showImmediately }: OverlayProps) => {
	const [show, setShow] = React.useState(showImmediately ?? false)
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
				{children}
			</div>
		</div>
	)
}
