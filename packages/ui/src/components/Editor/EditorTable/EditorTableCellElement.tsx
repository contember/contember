import { useClassName } from '@contember/utilities'
import { HTMLAttributes, memo, ReactNode } from 'react'
import { toEnumViewClass } from '../../../utils'

export interface EditorTableCellElementProps {
	attributes: HTMLAttributes<HTMLDivElement>
	children: ReactNode
	justify?: 'start' | 'center' | 'end'
	headerScope?: 'row'
}

/**
 * CAREFUL! This is only a separate component because of the editor but is unfortunately very tightly coupled with
 * the EditorTableElement component.
 */
export const EditorTableCellElement = memo(function EditorTableCellElement({
	attributes,
	children,
	justify,
	headerScope,
}: EditorTableCellElementProps) {
	return (
		<div
			{...attributes}
			className={useClassName('editorTable-cell', [
				attributes.className,
				toEnumViewClass(justify ? `justify-${justify}` : undefined),
				toEnumViewClass(headerScope ? `headerScope-${headerScope}` : undefined),
			])}
		>
			{children}
		</div>
	)
})
