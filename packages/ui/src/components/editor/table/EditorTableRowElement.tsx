import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix } from '../../../auxiliary'

export interface EditorTableRowElementProps {
	attributes: React.HTMLAttributes<HTMLDivElement>
	children: React.ReactNode
}

/**
 * CAREFUL! This is only a separate component because of the editor but is unfortunately very tightly coupled with
 * the EditorTableElement component.
 */
export const EditorTableRowElement = React.memo(function EditorTableRowElement({
	attributes,
	children,
}: EditorTableRowElementProps) {
	const prefix = useClassNamePrefix()
	return (
		<div {...attributes} className={cn(`${prefix}editorTable-row`)}>
			{children}
		</div>
	)
})
