import { useClassNameFactory } from '@contember/react-utils'
import { forwardRef, memo, ReactNode } from 'react'
import { toStateClass } from '../../../utils'

export interface FilePreviewProps {
	children?: ReactNode
	isActive?: boolean
	overlay?: ReactNode
}

/**
 * @group Forms UI
 */
export const FilePreview = memo(forwardRef<HTMLDivElement, FilePreviewProps>(({ children, isActive, overlay, ...rest }, forwardedRef) => {
	const componentClassName = useClassNameFactory('filePreview')

	return (
		<div ref={forwardedRef} className={componentClassName(null, toStateClass('active', isActive))} {...rest}>
			<div className={componentClassName('in')}>
				{overlay && <div className={componentClassName('overlay')}>{overlay}</div>}
				<div className={componentClassName('preview')}>{children}</div>
			</div>
		</div>
	)
}))
FilePreview.displayName = 'FilePreview'
