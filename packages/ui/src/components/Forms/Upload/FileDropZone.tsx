import { useClassNameFactory } from '@contember/utilities'
import { forwardRef, memo, ReactNode } from 'react'
import { HTMLDivElementProps } from '../../../types'
import { toStateClass } from '../../../utils'
import { Box } from '../../Box'

export type FileDropZoneProps =
	& {
		isActive?: boolean
		isAccepting?: boolean
		isRejecting?: boolean
		children?: ReactNode
	}
	& HTMLDivElementProps

/**
 * @group Forms UI
 */
export const FileDropZone = memo(forwardRef<HTMLDivElement, FileDropZoneProps>(({
	isActive,
	isAccepting,
	isRejecting,
	className,
	...props
}, ref) => {
	const componentClassName = useClassNameFactory('fileDropZone')

	return (
		<Box
			{...props}
			className={componentClassName(null, [
				toStateClass('active', isActive),
				toStateClass('accepting', isAccepting),
				toStateClass('rejecting', isRejecting),
				className,
			])}
			ref={ref}
		/>
	)
}))
FileDropZone.displayName = 'FileDropZone'
