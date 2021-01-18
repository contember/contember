import { EditorTableCellElement } from '@contember/ui'
import * as React from 'react'
import { RenderElementProps } from 'slate-react'
import { TableCellElement } from './TableCellElement'

export interface TableCellElementRendererProps extends Omit<RenderElementProps, 'element'> {
	element: TableCellElement
}

export function TableCellElementRenderer(props: TableCellElementRendererProps) {
	return (
		<EditorTableCellElement attributes={props.attributes} justify={props.element.justify}>
			{props.children}
		</EditorTableCellElement>
	)
}
