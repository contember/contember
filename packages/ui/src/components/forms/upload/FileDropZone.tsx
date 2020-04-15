import * as React from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import cn from 'classnames'
import { toStateClass } from '../../../utils'

export interface FileDropZoneProps {
	isActive: boolean
	children?: React.ReactNode
}

export const FileDropZone = React.memo(({ isActive, children }: FileDropZoneProps) => {
	const prefix = useClassNamePrefix()
	return <div className={cn(`${prefix}fileDropZone`, toStateClass('active', isActive))}>{children}</div>
})
FileDropZone.displayName = 'FileDropZone'
