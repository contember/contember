import * as React from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import cn from 'classnames'
import { toStateClass } from '../../../utils'

export interface FilePreviewProps {
	actions?: React.ReactNode
	children?: React.ReactNode
	isActive?: boolean
	overlay?: React.ReactNode
}

export const FilePreview = React.memo(({ actions, children, isActive, overlay }: FilePreviewProps) => {
	const prefix = useClassNamePrefix()
	// TODO actions
	return (
		<div className={cn(`${prefix}filePreview`, toStateClass('active', isActive))}>
			<div className={`${prefix}filePreview-in`}>
				{overlay && <div className={`${prefix}filePreview-overlay`}>{overlay}</div>}
				<div className={`${prefix}filePreview-preview`}>{children}</div>
			</div>
		</div>
	)
})
FilePreview.displayName = 'FilePreview'
