import cn from 'classnames'
import { memo, MouseEvent as ReactMouseEvent } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { toEnumViewClass } from '../../utils'

export interface EditorBlockBoundaryProps {
	blockEdge: 'before' | 'after'
	onClick: (e: ReactMouseEvent<HTMLDivElement>) => void
}

export const EditorBlockBoundary = memo(function EditorBlockBoundary({ blockEdge, onClick }: EditorBlockBoundaryProps) {
	const prefix = useClassNamePrefix()
	return (
		<div
			className={cn(`${prefix}editorBlockBoundary`, toEnumViewClass(`${blockEdge}Block`))}
			contentEditable={false}
			data-slate-editor={false}
			onClick={onClick}
		>
			<span className={`${prefix}editorBlockBoundary-inner`}>New paragraph</span>
		</div>
	)
})
