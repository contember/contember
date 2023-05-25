import { useClassName } from '@contember/utilities'
import { HTMLAttributes, ReactNode, memo } from 'react'
import { toEnumViewClass } from '../../../utils'

export interface EditorTableRowElementProps {
	attributes: HTMLAttributes<HTMLDivElement>
	children: ReactNode
	headerScope: 'table' | undefined
}

/**
 * CAREFUL! This is only a separate component because of the editor but is unfortunately very tightly coupled with
 * the EditorTableElement component.
 */
export const EditorTableRowElement = memo(function EditorTableRowElement({
	attributes,
	children,
	headerScope,
}: EditorTableRowElementProps) {
	return (
		<div
			{...attributes}
			className={useClassName('editorTable-row', [
				toEnumViewClass(headerScope ? `headerScope-${headerScope}` : undefined),
			])}
		>
			{children}
		</div>
	)
})
