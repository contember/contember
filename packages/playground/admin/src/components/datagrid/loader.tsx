import * as React from 'react'
import { cn } from '../../utils/cn'

export const DataViewLoaderOverlay = () => {
	const [show, setShow] = React.useState(false)
	React.useEffect(() => {
		requestAnimationFrame(() => {
			setShow(true)
		})
	}, [])

	return (
		<div className={cn('absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 backdrop-blur-sm transition-all duration-500 delay-200', show ? 'opacity-100' : 'opacity-0')}>
			<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900">
			</div>
		</div>
	)
}
