import { EditorTableCellElement } from '@contember/ui'
import type { RenderElementProps } from 'slate-react'
import type { TableCellElement } from './TableCellElement'

export interface TableCellElementRendererProps extends Omit<RenderElementProps, 'element'> {
	element: TableCellElement
}

export function TableCellElementRenderer(props: TableCellElementRendererProps) {
	return (
		<EditorTableCellElement
			attributes={props.attributes}
			justify={props.element.justify}
			headerScope={props.element.headerScope}
		>
			{props.children}
		</EditorTableCellElement>
	)
}
