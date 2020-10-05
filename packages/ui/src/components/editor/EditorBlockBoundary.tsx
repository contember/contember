import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix } from '../../auxiliary'
import { toEnumViewClass } from '../../utils'

export interface EditorBlockBoundaryProps {
	blockEdge: 'before' | 'after'
	onClick: (e: React.MouseEvent<HTMLDivElement>) => void
}

export const EditorBlockBoundary = React.memo(function EditorBlockBoundary({
	blockEdge,
	onClick,
}: EditorBlockBoundaryProps) {
	const prefix = useClassNamePrefix()
	return (
		<div
			className={cn(`${prefix}editorBlockBoundary`, toEnumViewClass(`${blockEdge}Block`))}
			contentEditable={false}
			data-slate-editor={false}
			onClick={onClick}
		/>
	)
})
