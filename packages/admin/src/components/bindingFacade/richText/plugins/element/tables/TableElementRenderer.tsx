import { EditorTableElement } from '@contember/ui'
import * as React from 'react'
import { Transforms, Editor as SlateEditor, Range as SlateRange } from 'slate'
import { ReactEditor, RenderElementProps, useEditor, useFocused, useSelected } from 'slate-react'
import { BaseEditor } from '../../../baseEditor'
import { EditorWithTables } from './EditorWithTables'
import { TableElement } from './TableElement'
import { TableRowElement } from './TableRowElement'

export interface TableElementRendererProps extends Omit<RenderElementProps, 'element'> {
	element: TableElement
}

export const TableElementRenderer = React.memo(function TableElementRenderer(props: TableElementRendererProps) {
	const editor = useEditor() as EditorWithTables<BaseEditor>
	const isSelected = useSelected()
	const isFocused = false

	const addRow = React.useCallback((index?: number) => editor.addTableRow(props.element, index), [
		editor,
		props.element,
	])
	const addColumn = React.useCallback((index?: number) => editor.addTableColumn(props.element, index), [
		editor,
		props.element,
	])
	const deleteRow = React.useCallback((index: number) => editor.deleteTableRow(props.element, index), [
		editor,
		props.element,
	])
	const deleteColumn = React.useCallback((index: number) => editor.deleteTableColumn(props.element, index), [
		editor,
		props.element,
	])
	// TODO this kind of works but ends up generating tons of operations when used to delete the whole table.
	// 		it would require more testing to ensure that it works well so it will have to wait for now.
	// const selectTable = React.useCallback(() => {
	// 	const tablePath = ReactEditor.findPath(editor, props.element)
	// 	const firstTablePoint = SlateEditor.start(editor, tablePath)
	// 	const lastTablePoint = SlateEditor.end(editor, tablePath)
	//
	// 	const beforeFirst = SlateEditor.before(editor, firstTablePoint)
	// 	const afterLast = SlateEditor.after(editor, lastTablePoint)
	//
	// 	let range: SlateRange
	// 	if (beforeFirst) {
	// 		range = {
	// 			anchor: lastTablePoint,
	// 			focus: beforeFirst,
	// 		}
	// 	} else if (afterLast) {
	// 		range = {
	// 			anchor: firstTablePoint,
	// 			focus: afterLast,
	// 		}
	// 	} else {
	// 		range = {
	// 			anchor: firstTablePoint,
	// 			focus: lastTablePoint,
	// 		}
	// 	}
	// 	Transforms.select(editor, range)
	// }, [editor, props.element])
	const deleteTable = React.useCallback(() => {
		Transforms.removeNodes(editor, {
			at: ReactEditor.findPath(editor, props.element),
			match: node => editor.isTable(node),
		})
	}, [editor, props.element])
	return (
		<div {...props.attributes}>
			<EditorTableElement
				rowCount={props.element.children.length}
				columnCount={(props.element.children[0] as TableRowElement | undefined)?.children.length ?? 0}
				addRow={addRow}
				addColumn={addColumn}
				deleteRow={deleteRow}
				deleteColumn={deleteColumn}
				//selectTable={selectTable}
				deleteTable={deleteTable}
				isSelected={isSelected}
				isFocused={isFocused}
			>
				{props.children}
			</EditorTableElement>
		</div>
	)
})
