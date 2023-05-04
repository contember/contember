import cn from 'classnames'
import { forwardRef, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'

export interface EditorBlockProps {
	children?: ReactNode
	dragHandle?: ReactNode
	dragLine?: boolean
	isDragged?: boolean
}

export const EditorBlock = memo(forwardRef<HTMLDivElement, EditorBlockProps>(({
  children,
  dragHandle,
  dragLine,
  isDragged,
}, ref) => {
	const prefix = useClassNamePrefix()
	return (
		<div className={cn(`${prefix}editorBlock`, isDragged && 'is-dragged')} ref={ref}>
			<div className={cn(`${prefix}editorBlock-inner`)}>
				{dragHandle && <div className={cn(`${prefix}editorBlock-dragHandle`)} contentEditable={false}>{dragHandle}</div>}
				<div className={cn(`${prefix}editorBlock-content`)}>
					{children}
				</div>
			</div>
		</div>
	)
}))
