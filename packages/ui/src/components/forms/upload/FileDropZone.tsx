import cn from 'classnames'
import { forwardRef, HTMLAttributes, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import { toStateClass } from '../../../utils'

export interface FileDropZoneProps extends HTMLAttributes<HTMLDivElement> {
	isActive?: boolean
	children?: ReactNode
}

export const FileDropZone = memo(
	forwardRef<HTMLDivElement, FileDropZoneProps>(({ isActive, className, ...props }, ref) => {
		const prefix = useClassNamePrefix()
		return (
			<div {...props} className={cn(`${prefix}fileDropZone`, toStateClass('active', isActive), className)} ref={ref} />
		)
	}),
)
FileDropZone.displayName = 'FileDropZone'
