import * as React from 'react'
import cn from 'classnames'
import { useClassNamePrefix } from '../../../auxiliary'

export interface EditorTableCellElementProps {
	attributes: React.HTMLAttributes<HTMLDivElement>
	rowNumber: number
	columnNumber: number
	children: React.ReactNode
}

export const EditorTableCellElement = React.memo(function EditorTableCellElement({
	attributes,
	children,
	rowNumber,
	columnNumber,
}: EditorTableCellElementProps) {
	const prefix = useClassNamePrefix()
	return (
		<div
			{...attributes}
			className={cn(attributes.className, `${prefix}editorTable-cell`)}
			style={
				{
					...attributes.style,
					[`--${prefix}editorTable-row`]: rowNumber,
					[`--${prefix}editorTable-column`]: columnNumber,
				} as React.CSSProperties
			}
		>
			{children}
		</div>
	)
})
