import { useClassNameFactory } from '@contember/utilities'
import { forwardRef, memo, ReactNode } from 'react'

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
	const componentClassName = useClassNameFactory('editorBlock')

	return (
		<div className={componentClassName('', isDragged && 'is-dragged')} ref={ref}>
			<div className={componentClassName('inner')}>
				{dragHandle && <div className={componentClassName('dragHandle')} contentEditable={false}>{dragHandle}</div>}
				<div className={componentClassName('content')}>
					{children}
				</div>
			</div>
		</div>
	)
}))
