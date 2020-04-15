import * as React from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import cn from 'classnames'
import { toStateClass } from '../../../utils'

export interface FileDropZoneProps extends React.HTMLAttributes<HTMLDivElement> {
	isActive?: boolean
	children?: React.ReactNode
}

export const FileDropZone = React.memo(
	React.forwardRef<HTMLDivElement, FileDropZoneProps>(({ isActive, className, ...props }, ref) => {
		const prefix = useClassNamePrefix()
		return (
			<div {...props} className={cn(`${prefix}fileDropZone`, toStateClass('active', isActive), className)} ref={ref} />
		)
	}),
)
FileDropZone.displayName = 'FileDropZone'
