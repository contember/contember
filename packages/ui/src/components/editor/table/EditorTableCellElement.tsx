import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix } from '../../../auxiliary'

export interface EditorTableCellElementProps {
	attributes: React.HTMLAttributes<HTMLDivElement>
	children: React.ReactNode
}

export const EditorTableCellElement = React.memo(function EditorTableCellElement({
	attributes,
	children,
}: EditorTableCellElementProps) {
	const prefix = useClassNamePrefix()
	return (
		<div {...attributes} className={cn(attributes.className, `${prefix}editorTable-cell`)}>
			{children}
		</div>
	)
})
