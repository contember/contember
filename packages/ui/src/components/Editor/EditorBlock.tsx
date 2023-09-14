import { useClassNameFactory } from '@contember/react-utils'
import { deprecate, isDefined } from '@contember/utilities'
import { ReactNode, forwardRef, memo } from 'react'

export interface EditorBlockProps {
	children?: ReactNode
	dragHandle?: ReactNode
	/** @deprecated Unused prop, no alternative since 1.4.0 */
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
	deprecate('1.4.0', isDefined(dragLine), '`dragLine` prop', null)

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
