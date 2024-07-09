import { TableCellElement } from '@contember/react-slate-editor-base'
import type { RenderElementProps } from 'slate-react'

export interface TableCellElementRendererProps extends Omit<RenderElementProps, 'element'> {
	element: TableCellElement
}

export function TableCellElementRenderer(props: TableCellElementRendererProps) {
	return (
		<td
			{...props.attributes}
			className="border min-w-40"
			// attributes={props.attributes}
			// justify={props.element.justify}
			// headerScope={props.element.headerScope}
		>
			{props.children}
		</td>
	)
}
