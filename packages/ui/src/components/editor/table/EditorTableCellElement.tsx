import cn from 'classnames'
import { HTMLAttributes, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import { toEnumViewClass } from '../../../utils'

export interface EditorTableCellElementProps {
	attributes: HTMLAttributes<HTMLDivElement>
	children: ReactNode
	justify?: 'start' | 'center' | 'end'
}

/**
 * CAREFUL! This is only a separate component because of the editor but is unfortunately very tightly coupled with
 * the EditorTableElement component.
 */
export const EditorTableCellElement = memo(function EditorTableCellElement({
	attributes,
	children,
	justify,
}: EditorTableCellElementProps) {
	const prefix = useClassNamePrefix()
	return (
		<div
			{...attributes}
			className={cn(
				attributes.className,
				`${prefix}editorTable-cell`,
				toEnumViewClass(justify ? `justify-${justify}` : undefined),
			)}
		>
			{children}
		</div>
	)
})
