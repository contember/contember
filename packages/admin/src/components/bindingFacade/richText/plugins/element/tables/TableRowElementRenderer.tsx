import { EditorTableRowElement } from '@contember/ui'
import { memo } from 'react'
import { RenderElementProps } from 'slate-react'
import { TableRowElement } from './TableRowElement'

export interface TableRowElementRendererProps extends Omit<RenderElementProps, 'element'> {
	element: TableRowElement
}

export const TableRowElementRenderer = memo(function TableRowElementRenderer(props: TableRowElementRendererProps) {
	return (
		<EditorTableRowElement attributes={props.attributes} headerScope={props.element.headerScope}>
			{props.children}
		</EditorTableRowElement>
	)
})
