import { ReactEditor } from 'slate-react'
import { Editor, Path as SlatePath, Transforms } from 'slate'
import { TableCellElement } from './TableCellElement'
import { TableElement } from './TableElement'

export const selectTableCellContents = (editor: Editor, table: TableElement | SlatePath, rowIndex: number, columnIndex: number) => {
	if (!Array.isArray(table)) {
		table = ReactEditor.findPath(editor, table)
	}
	Transforms.select(editor, {
		anchor: Editor.start(editor, [...table, rowIndex, columnIndex]),
		focus: Editor.end(editor, [...table, rowIndex, columnIndex]),
	})
}

export const getTableCellCoordinates = (editor: Editor, element: TableCellElement) => {
	const cellPath = ReactEditor.findPath(editor, element)
	return cellPath.slice(-2) as [number, number]
}
