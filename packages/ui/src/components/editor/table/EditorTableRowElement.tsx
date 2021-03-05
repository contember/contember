import cn from 'classnames'
import { HTMLAttributes, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'

export interface EditorTableRowElementProps {
	attributes: HTMLAttributes<HTMLDivElement>
	children: ReactNode
}

/**
 * CAREFUL! This is only a separate component because of the editor but is unfortunately very tightly coupled with
 * the EditorTableElement component.
 */
export const EditorTableRowElement = memo(function EditorTableRowElement({
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
