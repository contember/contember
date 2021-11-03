import { Editor, NodeEntry, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import { getTableElementColumnCount, getTableElementRowCount, TableElement } from './TableElement'
import { createEmptyTableRowElement, isTableRowElement, TableRowElement, tableRowElementType } from './TableRowElement'
import { ContemberEditor } from '../../../ContemberEditor'
import {
	createEmptyTableCellElement,
	isTableCellElement,
	TableCellElement,
	tableCellElementType,
} from './TableCellElement'

export class TableModifications {
	public static deleteTableColumn(editor: Editor, element: TableElement, index: number) {
		const tablePath = ReactEditor.findPath(editor, element)
		const rowCount = element.children.length

		Editor.withoutNormalizing(editor, () => {
			for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
				Transforms.removeNodes(editor, {
					at: [...tablePath, rowIndex, index],
				})
			}
		})
	}

	public static addTableRow(editor: Editor, element: TableElement, index?: number) {
		const tablePath = ReactEditor.findPath(editor, element)
		const columnCount = getTableElementColumnCount(element)
		const rowIndex = index ?? element.children.length

		let tableRow: TableRowElement
		if (element.children.length === 0) {
			tableRow = createEmptyTableRowElement(columnCount)
		} else {
			const blueprintRow = element.children[rowIndex === 0 ? 0 : rowIndex - 1] as TableRowElement

			tableRow = {
				...ContemberEditor.elementToSpecifics(blueprintRow),
				type: tableRowElementType,
				children: Array.from(
					{ length: columnCount },
					(_, columnIndex): TableCellElement => copyTableCell(blueprintRow.children[columnIndex] as TableCellElement),
				),
			}

			if (rowIndex === 0) {
				const firstRow = element.children[0] as TableRowElement
				if (firstRow.headerScope) {
					Transforms.setNodes(editor, { headerScope: null }, { at: [...tablePath, 0] })
				}
			}
		}

		Transforms.insertNodes(editor, tableRow, {
			at: [...tablePath, rowIndex],
		})
	}

	public static addTableColumn(editor: Editor, element: TableElement, index?: number) {
		const tablePath = ReactEditor.findPath(editor, element)
		const columnCount = getTableElementColumnCount(element)
		const rowCount = getTableElementRowCount(element)
		const columnIndex = index ?? columnCount ?? 0

		Editor.withoutNormalizing(editor, () => {
			for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
				const tableRow = element.children[rowIndex] as TableRowElement

				let tableCell: TableCellElement
				if (tableRow.children.length === 0) {
					tableCell = createEmptyTableCellElement()
				} else {
					tableCell = copyTableCell(tableRow.children[columnIndex === 0 ? 0 : columnIndex - 1] as TableCellElement)

					if (columnIndex === 0) {
						const firstCell = tableRow.children[0] as TableCellElement
						if (firstCell.headerScope) {
							Transforms.setNodes(editor, { headerScope: null }, { at: [...tablePath, rowIndex, 0] })
						}
					}
				}

				Transforms.insertNodes(editor, tableCell, {
					at: [...tablePath, rowIndex, columnIndex],
				})
			}
		})
	}

	public static justifyTableColumn(editor: Editor, element: TableElement, columnIndex: number, direction: TableCellElement['justify']) {
		forEachCellInColumn(editor, element, columnIndex, ([, cellPath]) => {
			Transforms.setNodes(
				editor,
				{ justify: direction ?? null },
				{ match: node => isTableCellElement(node), at: cellPath },
			)
		})
	}

	public static toggleTableRowHeaderScope(editor: Editor, element: TableElement, rowIndex: number, scope: TableRowElement['headerScope']) {
		const rowCount = element.children.length
		if (rowIndex !== 0 || rowCount < 1) {
			return
		}
		const tablePath = ReactEditor.findPath(editor, element)
		const firstRow = element.children[0] as TableRowElement

		Transforms.setNodes(
			editor,
			{ headerScope: firstRow.headerScope === scope ? null : scope },
			{ match: node => isTableRowElement(node), at: [...tablePath, 0] },
		)
	}

	public static toggleTableColumnHeaderScope(editor: Editor, element: TableElement, columnIndex: number, scope: TableCellElement['headerScope']) {
		let currentStatusScore = 0
		const rowCount = element.children.length

		forEachCellInColumn(editor, element, columnIndex, ([cell]) => {
			currentStatusScore += cell.headerScope === scope ? 1 : -1
		})

		// If none have it or the majority does but not all.
		const shouldSetScope =
			-currentStatusScore === rowCount || (currentStatusScore > 0 && currentStatusScore !== rowCount)

		forEachCellInColumn(editor, element, columnIndex, ([, cellPath]) => {
			Transforms.setNodes(
				editor,
				{ headerScope: shouldSetScope ? scope : null },
				{ match: node => isTableCellElement(node), at: cellPath },
			)
		})
	}

	public static deleteTableRow(editor: Editor, element: TableElement, index: number) {
		const tablePath = ReactEditor.findPath(editor, element)
		Transforms.removeNodes(editor, {
			at: [...tablePath, index],
		})
	}
}

const forEachCellInColumn = (
	editor: Editor,
	element: TableElement,
	columnIndex: number,
	callback: (cellEntry: NodeEntry<TableCellElement>) => void,
) => {
	const tablePath = ReactEditor.findPath(editor, element)
	const rowCount = getTableElementRowCount(element)

	Editor.withoutNormalizing(editor, () => {
		for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
			callback(Editor.node(editor, [...tablePath, rowIndex, columnIndex]) as NodeEntry<TableCellElement>)
		}
	})
}
const copyTableCell = (tableCellElement: TableCellElement): TableCellElement => ({
	...ContemberEditor.elementToSpecifics(tableCellElement),
	type: tableCellElementType,
	children: [{ text: '' }],
})

