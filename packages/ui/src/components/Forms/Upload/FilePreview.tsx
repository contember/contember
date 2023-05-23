import cn from 'classnames'
import { memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import { toStateClass } from '../../../utils'

export interface FilePreviewProps {
	actions?: ReactNode
	children?: ReactNode
	isActive?: boolean
	overlay?: ReactNode
}

/**
 * @group Forms UI
 */
export const FilePreview = memo(({ actions, children, isActive, overlay }: FilePreviewProps) => {
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
