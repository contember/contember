import cn from 'classnames'
import { forwardRef, HTMLAttributes, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import { toStateClass } from '../../../utils'
import { Box } from '../../Box'

export interface FileDropZoneProps extends HTMLAttributes<HTMLDivElement> {
	isActive?: boolean
	isAccepting?: boolean
	isRejecting?: boolean
	children?: ReactNode
}

export const FileDropZone = memo(
	forwardRef<HTMLDivElement, FileDropZoneProps>(({ isActive, isAccepting, isRejecting, className, ...props }, ref) => {
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
	}),
)
FileDropZone.displayName = 'FileDropZone'
