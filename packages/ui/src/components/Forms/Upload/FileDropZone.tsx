import cn from 'classnames'
import { forwardRef, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import { toStateClass } from '../../../utils'
import { Box } from '../../Box'
import { HTMLDivElementProps } from '../../../types'

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
	const prefix = useClassNamePrefix()
	return (
		<Box
			{...props}
			className={cn(
				`${prefix}fileDropZone`,
				toStateClass('active', isActive),
				toStateClass('accepting', isAccepting),
				toStateClass('rejecting', isRejecting),
				className,
			)}
			ref={ref}
		/>
	)
}))
FileDropZone.displayName = 'FileDropZone'
