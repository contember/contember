import { EditorTableElement } from '@contember/ui'
import * as React from 'react'
import { RenderElementProps, useEditor } from 'slate-react'
import { BaseEditor } from '../../../baseEditor'
import { EditorWithTables } from './EditorWithTables'
import { TableElement } from './TableElement'
import { TableRowElement } from './TableRowElement'

export interface TableElementRendererProps extends Omit<RenderElementProps, 'element'> {
	element: TableElement
}

export const TableElementRenderer = React.memo(function TableElementRenderer(props: TableElementRendererProps) {
	const editor = useEditor() as EditorWithTables<BaseEditor>
	const addRow = React.useCallback(
		(index?: number) => {
			editor.addTableRow(props.element, index)
		},
		[editor, props.element],
	)
	const addColumn = React.useCallback(
		(index?: number) => {
			editor.addTableColumn(props.element, index)
		},
		[editor, props.element],
	)
	return (
		<div {...props.attributes}>
			<EditorTableElement
				rowCount={props.element.children.length}
				columnCount={(props.element.children[0] as TableRowElement | undefined)?.children.length ?? 0}
				deleteTable={() => 0}
				addRow={addRow}
				addColumn={addColumn}
				isSelected={false} // TODO
				isFocused={false} // TODO
			>
				{props.children}
			</EditorTableElement>
		</div>
	)
})
