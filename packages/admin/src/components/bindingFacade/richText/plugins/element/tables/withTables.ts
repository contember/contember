import * as React from 'react'
import {
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	NodeEntry,
	Path as SlatePath,
	Range as SlateRange,
	Transforms,
} from 'slate'
import { ReactEditor } from 'slate-react'
import { BaseEditor } from '../../../baseEditor'
import { ContemberEditor } from '../../../ContemberEditor'
import { EditorWithTables } from './EditorWithTables'
import { TableCellElement, tableCellElementType } from './TableCellElement'
import { TableCellElementRenderer, TableCellElementRendererProps } from './TableCellElementRenderer'
import { TableElement, tableElementType } from './TableElement'
import { TableElementRenderer, TableElementRendererProps } from './TableElementRenderer'
import { TableRowElement, tableRowElementType } from './TableRowElement'
import { TableRowElementRenderer, TableRowElementRendererProps } from './TableRowElementRenderer'

export const withTables = <E extends BaseEditor>(editor: E): EditorWithTables<E> => {
	const { renderElement, insertBreak, deleteBackward, normalizeNode, isElementActive, toggleElement } = editor

	const e = (editor as any) as EditorWithTables<E>

	Object.assign<EditorWithTables<BaseEditor>, Partial<EditorWithTables<BaseEditor>>>(e, {
		isTable: (element, suchThat): element is TableElement => element.type === tableElementType,
		isTableRow: (element, suchThat): element is TableRowElement => element.type === tableRowElementType,
		isTableCell: (element, suchThat): element is TableCellElement => element.type === tableCellElementType,
		createEmptyTableElement: (rowCount = 3, columnCount = 2) => ({
			type: tableElementType,
			children: Array.from({ length: rowCount }, () => e.createEmptyTableRowElement(columnCount)),
		}),
		createEmptyTableRowElement: (columnCount = 2) => ({
			type: tableRowElementType,
			children: Array.from({ length: columnCount }, () => e.createEmptyTableCellElement()),
		}),
		createEmptyTableCellElement: () => ({
			type: tableCellElementType,
			children: [{ text: '' }],
		}),

		getTableCellCoordinates: (element: TableCellElement) => {
			const cellPath = ReactEditor.findPath(e, element)
			return cellPath.slice(-2) as [number, number]
		},
		getTableRowNumber: (element: TableRowElement | TableCellElement) => {
			if (e.isTableCell(element)) {
				return e.getTableCellCoordinates(element)[0]
			}
			const rowPath = ReactEditor.findPath(e, element)
			return rowPath[rowPath.length - 1]
		},
		addTableRow: (element: TableElement, index?: number) => {
			const tablePath = ReactEditor.findPath(e, element)
			const firstRow = element.children[0] as TableRowElement | undefined
			const columnCount = firstRow?.children.length
			const rowIndex = index ?? element.children.length

			Transforms.insertNodes(e, e.createEmptyTableRowElement(columnCount), {
				at: [...tablePath, rowIndex],
			})
		},
		addTableColumn: (element: TableElement, index?: number) => {
			const tablePath = ReactEditor.findPath(e, element)
			const firstRow = element.children[0] as TableRowElement | undefined
			const columnCount = firstRow?.children.length
			const rowCount = element.children.length
			const columnIndex = index ?? columnCount ?? 0

			Editor.withoutNormalizing(e, () => {
				for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
					Transforms.insertNodes(e, e.createEmptyTableCellElement(), {
						at: [...tablePath, rowIndex, columnIndex],
					})
				}
			})
		},
		deleteTableRow: (element: TableElement, index: number) => {
			const tablePath = ReactEditor.findPath(e, element)
			Transforms.removeNodes(e, {
				at: [...tablePath, index],
			})
		},
		deleteTableColumn: (element: TableElement, index: number) => {
			const tablePath = ReactEditor.findPath(e, element)
			const rowCount = element.children.length

			Editor.withoutNormalizing(e, () => {
				for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
					Transforms.removeNodes(e, {
						at: [...tablePath, rowIndex, index],
					})
				}
			})
		},

		renderElement: props => {
			switch (props.element.type) {
				case tableElementType:
					return React.createElement(TableElementRenderer, props as TableElementRendererProps)
				case tableRowElementType:
					return React.createElement(TableRowElementRenderer, props as TableRowElementRendererProps)
				case tableCellElementType:
					return React.createElement(TableCellElementRenderer, props as TableCellElementRendererProps)
				default:
					return renderElement(props)
			}
		},
		isElementActive: (elementType, suchThat) => {
			switch (elementType) {
				case tableElementType:
				case tableRowElementType:
				case tableCellElementType: {
					const closestTableEntry = Editor.above(e, {
						mode: 'lowest',
						match: matchedNode => SlateElement.isElement(matchedNode) && e.isTable(matchedNode),
					})
					return closestTableEntry !== undefined
				}
				default:
					return isElementActive(elementType, suchThat)
			}
		},
		toggleElement: (elementType, suchThat) => {
			if (elementType === tableRowElementType || elementType === tableCellElementType) {
				return // table rows/cells cannot be manually toggled
			}
			if (elementType !== tableElementType) {
				return toggleElement(elementType, suchThat)
			}

			if (e.isElementActive(elementType, suchThat)) {
				return // TODO nope.
			}
			const { selection } = editor
			if (!selection || SlateRange.isExpanded(selection)) {
				return
			}

			const closestDefaultEntry: NodeEntry | undefined = Editor.above(e, {
				at: selection.focus,
				mode: 'lowest',
				match: matchedNode => SlateElement.isElement(matchedNode) && e.isDefaultElement(matchedNode),
			})
			if (!closestDefaultEntry) {
				return
			}
			const [closestDefault, closestDefaultPath] = closestDefaultEntry

			if (closestDefaultPath.length !== 1) {
				return // We only support tables at the very top level
			}

			Editor.withoutNormalizing(e, () => {
				let targetPath: SlatePath
				if (SlateNode.string(closestDefault) === '') {
					Transforms.removeNodes(e, {
						at: closestDefaultPath,
					})
					targetPath = closestDefaultPath
				} else {
					targetPath = [closestDefaultPath[0] + 1]
				}
				const table = e.createEmptyTableElement()

				Transforms.insertNodes(e, table, {
					at: targetPath,
				})
			})
		},
	})

	return (editor as unknown) as EditorWithTables<E>
}
