import {
	ReactNode,
	ReactElement,
	useMemo,
	useCallback,
	useEffect,
	useRef,
	ComponentType,
	MouseEvent as ReactMouseEvent,
	memo,
	useState,
	useContext,
} from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import cn from 'classnames'
import { toStateClass } from '../../../utils'

export interface FilePreviewProps {
	actions?: ReactNode
	children?: ReactNode
	isActive?: boolean
	overlay?: ReactNode
}

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
