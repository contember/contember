import { useClassNameFactory } from '@contember/utilities'
import { memo, ReactNode } from 'react'
import { toStateClass } from '../../../utils'

export interface FilePreviewProps {
	/** @deprecated not implemented */
	actions?: ReactNode;
	children?: ReactNode
	isActive?: boolean
	overlay?: ReactNode
}

/**
 * @group Forms UI
 */
export const FilePreview = memo(({ children, isActive, overlay }: FilePreviewProps) => {
	const componentClassName = useClassNameFactory('filePreview')

	return (
		<div className={componentClassName(null, toStateClass('active', isActive))}>
			<div className={componentClassName('in')}>
				{overlay && <div className={componentClassName('overlay')}>{overlay}</div>}
				<div className={componentClassName('preview')}>{children}</div>
			</div>
		</div>
	)
})
FilePreview.displayName = 'FilePreview'
