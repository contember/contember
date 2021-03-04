import { EditorTableElement } from '@contember/ui'
import { memo, useCallback } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useEditor, useSelected } from 'slate-react'
import { BaseEditor, BlockElement } from '../../../baseEditor'
import { EditorWithTables } from './EditorWithTables'
import { TableCellElement } from './TableCellElement'
import { TableElement } from './TableElement'
import { TableRowElement } from './TableRowElement'

export interface TableElementRendererProps extends Omit<RenderElementProps, 'element'> {
	element: TableElement
}

export const TableElementRenderer = memo(function TableElementRenderer(props: TableElementRendererProps) {
	const editor = useEditor() as EditorWithTables<BaseEditor>
	const isSelected = useSelected()
	const isFocused = false

	const addRow = useCallback((index?: number) => editor.addTableRow(props.element, index), [editor, props.element])
	const addColumn = useCallback((index?: number) => editor.addTableColumn(props.element, index), [
		editor,
		props.element,
	])
	const justifyColumn = useCallback(
		(index: number, direction: TableCellElement['justify']) =>
			editor.justifyTableColumn(props.element, index, direction),
		[editor, props.element],
	)
	const deleteRow = useCallback((index: number) => editor.deleteTableRow(props.element, index), [editor, props.element])
	const deleteColumn = useCallback((index: number) => editor.deleteTableColumn(props.element, index), [
		editor,
		props.element,
	])
	// TODO this kind of works but ends up generating tons of operations when used to delete the whole table.
	// 		it would require more testing to ensure that it works well so it will have to wait for now.
	// const selectTable = useCallback(() => {
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
	const deleteTable = useCallback(() => {
		Transforms.removeNodes(editor, {
			at: ReactEditor.findPath(editor, props.element),
			match: node => editor.isTable(node),
		})
	}, [editor, props.element])
	return (
		<BlockElement element={props.element} attributes={props.attributes} withBoundaries>
			<EditorTableElement
				rowCount={props.element.children.length}
				columnCount={(props.element.children[0] as TableRowElement | undefined)?.children.length ?? 0}
				addRow={addRow}
				addColumn={addColumn}
				justifyColumn={justifyColumn}
				deleteRow={deleteRow}
				deleteColumn={deleteColumn}
				//selectTable={selectTable}
				deleteTable={deleteTable}
				isSelected={isSelected}
				isFocused={isFocused}
			>
				{props.children}
			</EditorTableElement>
		</BlockElement>
	)
})
