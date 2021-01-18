import * as React from 'react'
import {
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	NodeEntry,
	Path as SlatePath,
	Point,
	Range as SlateRange,
	Text,
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
	const {
		renderElement,
		deleteForward,
		deleteBackward,
		normalizeNode,
		deleteFragment,
		insertBreak,
		isElementActive,
		toggleElement,
		onKeyDown,
	} = editor

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

		selectTableCellContents: (table, rowIndex, columnIndex) => {
			if (!Array.isArray(table)) {
				table = ReactEditor.findPath(e, table)
			}
			Transforms.select(e, {
				anchor: Editor.start(e, [...table, rowIndex, columnIndex]),
				focus: Editor.end(e, [...table, rowIndex, columnIndex]),
			})
		},

		getTableCellCoordinates: (element: TableCellElement) => {
			const cellPath = ReactEditor.findPath(e, element)
			return cellPath.slice(-2) as [number, number]
		},
		getTableRowCount: (element: TableElement): number => {
			return element.children.length
		},
		getTableColumnCount: (element: TableElement): number => {
			const firstRow = element.children[0] as TableRowElement | undefined
			return firstRow?.children.length ?? 0
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
			const columnCount = e.getTableColumnCount(element)
			const rowIndex = index ?? element.children.length

			Transforms.insertNodes(e, e.createEmptyTableRowElement(columnCount), {
				at: [...tablePath, rowIndex],
			})
		},
		addTableColumn: (element: TableElement, index?: number) => {
			const tablePath = ReactEditor.findPath(e, element)
			const columnCount = e.getTableColumnCount(element)
			const rowCount = e.getTableRowCount(element)
			const columnIndex = index ?? columnCount ?? 0

			Editor.withoutNormalizing(e, () => {
				for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
					Transforms.insertNodes(e, e.createEmptyTableCellElement(), {
						at: [...tablePath, rowIndex, columnIndex],
					})
				}
			})
		},
		justifyTableColumn: (element: TableElement, columnIndex: number, direction: TableCellElement['justify']) => {
			const tablePath = ReactEditor.findPath(e, element)
			const rowCount = e.getTableRowCount(element)

			Editor.withoutNormalizing(e, () => {
				for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
					Transforms.setNodes(
						editor,
						{ justify: direction ?? null },
						{ match: node => e.isTableCell(node), at: [...tablePath, rowIndex, columnIndex] },
					)
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
		insertBreak: () => {
			const closestBlockEntry = ContemberEditor.closestBlockEntry(e)
			if (closestBlockEntry && e.isTableCell(closestBlockEntry[0])) {
				return // TODO insert <br />
			}
			insertBreak()
		},
		deleteBackward: unit => {
			const selection = editor.selection
			if (selection && SlateRange.isCollapsed(selection)) {
				const closestBlockEntry = ContemberEditor.closestBlockEntry(e)
				if (
					closestBlockEntry &&
					e.isTableCell(closestBlockEntry[0]) &&
					Point.equals(selection.focus, Editor.start(e, closestBlockEntry[1]))
				) {
					return
				}
			}
			deleteBackward(unit)
		},
		deleteForward: unit => {
			const selection = editor.selection
			if (selection && SlateRange.isCollapsed(selection)) {
				const closestBlockEntry = ContemberEditor.closestBlockEntry(e)
				if (
					closestBlockEntry &&
					e.isTableCell(closestBlockEntry[0]) &&
					Point.equals(selection.focus, Editor.end(e, closestBlockEntry[1]))
				) {
					return
				}
			}
			deleteForward(unit)
		},
		deleteFragment: () => {
			const selection = editor.selection
			if (!selection || SlateRange.isCollapsed(selection)) {
				return deleteFragment()
			}
			const lowestCommonAncestorPath = SlatePath.common(selection.anchor.path, selection.focus.path)
			const [lowestCommonAncestor] = Editor.node(e, lowestCommonAncestorPath)

			if (e.isTable(lowestCommonAncestor) || e.isTableRow(lowestCommonAncestor)) {
				return // TODO nope for now
			}
			deleteFragment()
		},
		onKeyDown: event => {
			if (
				!editor.selection ||
				!(
					event.key === 'Tab' ||
					event.key === 'ArrowUp' ||
					event.key === 'ArrowRight' ||
					event.key === 'ArrowDown' ||
					event.key === 'ArrowLeft'
				)
			) {
				return onKeyDown(event)
			}
			const closestBlockEntry = Editor.above(editor, {
				at: editor.selection,
				match: node => Editor.isBlock(editor, node),
			})
			if (!closestBlockEntry || !e.isTableCell(closestBlockEntry[0])) {
				return onKeyDown(event)
			}
			const [cellElement, cellPath] = closestBlockEntry
			if (cellPath.length < 3) {
				return onKeyDown(event)
			}
			const [rowIndex, columnIndex] = e.getTableCellCoordinates(cellElement)
			const tablePath = cellPath.slice(0, -2)
			const tableElement = SlateNode.get(editor, tablePath) as TableElement
			const rowCount = e.getTableRowCount(tableElement)
			const columnCount = e.getTableColumnCount(tableElement)

			if (rowCount === 0 || columnCount === 0) {
				return
			}

			const moveSelectionBeforeTable = () => {
				const pointBeforeTable = Editor.before(e, tablePath)
				if (!pointBeforeTable) {
					return onKeyDown(event)
				}
				event.preventDefault()
				return Transforms.select(e, pointBeforeTable)
			}
			const moveSelectionAfterTable = () => {
				const pointAfterTable = Editor.after(e, tablePath)
				if (!pointAfterTable) {
					return onKeyDown(event)
				}
				event.preventDefault()
				return Transforms.select(e, pointAfterTable)
			}

			if (event.key === 'Tab') {
				if (event.shiftKey) {
					// Moving backwards
					if (columnIndex > 0) {
						event.preventDefault()
						return e.selectTableCellContents(tablePath, rowIndex, columnIndex - 1)
					} else if (columnIndex === 0) {
						if (rowIndex > 0) {
							event.preventDefault()
							return e.selectTableCellContents(tablePath, rowIndex - 1, columnCount - 1)
						}
						return moveSelectionBeforeTable()
					}
				} else {
					// Moving forwards
					if (columnIndex < columnCount - 1) {
						event.preventDefault()
						return e.selectTableCellContents(tablePath, rowIndex, columnIndex + 1)
					} else if (columnIndex === columnCount - 1) {
						// We're at the right edge of the table
						if (rowIndex < rowCount - 1) {
							event.preventDefault()
							return e.selectTableCellContents(tablePath, rowIndex + 1, 0)
						} else if (rowIndex === rowCount - 1) {
							return moveSelectionAfterTable()
						}
					}
				}
			}
			const selection = editor.selection

			if (event.key === 'ArrowLeft') {
				if (!SlateRange.isCollapsed(selection)) {
					return onKeyDown(event)
				}
				if (Point.equals(selection.focus, Editor.start(e, cellPath))) {
					if (columnIndex > 0) {
						event.preventDefault()
						return Transforms.select(e, Editor.end(e, [...tablePath, rowIndex, columnIndex - 1]))
					} else if (columnIndex === 0) {
						if (rowIndex > 0) {
							event.preventDefault()
							return Transforms.select(e, Editor.end(e, [...tablePath, rowIndex - 1, columnCount - 1]))
						}
						return moveSelectionBeforeTable()
					}
				}
			} else if (event.key === 'ArrowRight') {
				if (!SlateRange.isCollapsed(selection)) {
					return onKeyDown(event)
				}
				if (Point.equals(selection.focus, Editor.end(e, cellPath))) {
					if (columnIndex < columnCount - 1) {
						event.preventDefault()
						return Transforms.select(e, Editor.start(e, [...tablePath, rowIndex, columnIndex + 1]))
					} else if (columnIndex === columnCount - 1) {
						if (rowIndex < rowCount - 1) {
							event.preventDefault()
							return Transforms.select(e, Editor.start(e, [...tablePath, rowIndex + 1, 0]))
						} else if (rowIndex === rowCount - 1) {
							return moveSelectionAfterTable()
						}
					}
				}
			} else if (event.key === 'ArrowUp') {
				if (rowIndex > 0) {
					event.preventDefault()
					const rowAboveEndPoint = Editor.end(e, [...tablePath, rowIndex - 1, columnIndex])

					if (!SlateRange.isCollapsed(selection)) {
						return Transforms.select(e, rowAboveEndPoint)
					}
					const minOffset = Math.min(selection.focus.offset, rowAboveEndPoint.offset)
					return Transforms.select(e, {
						path: rowAboveEndPoint.path,
						offset: minOffset,
					})
				}
				return moveSelectionBeforeTable()
			} else if (event.key === 'ArrowDown') {
				if (rowIndex < rowCount - 1) {
					event.preventDefault()
					const rowBelowStatPoint = Editor.start(e, [...tablePath, rowIndex + 1, columnIndex])

					if (!SlateRange.isCollapsed(selection)) {
						return Transforms.select(e, rowBelowStatPoint)
					}
					const [rowBelowStatPointNode] = Editor.node(e, rowBelowStatPoint) as NodeEntry<Text>

					return Transforms.select(e, {
						path: rowBelowStatPoint.path,
						offset: Math.min(selection.focus.offset, rowBelowStatPointNode.text.length),
					})
				}
				return moveSelectionAfterTable()
			}
			onKeyDown(event)
		},
		normalizeNode: entry => {
			const [node, path] = entry

			if (!SlateElement.isElement(node)) {
				return normalizeNode(entry)
			}
			// TODO validate consistent table dimensions
			if (e.isTable(node)) {
				for (const [child, childPath] of SlateNode.children(e, path)) {
					if (SlateElement.isElement(child)) {
						if (!e.isTableRow(child)) {
							ContemberEditor.ejectElement(e, childPath)
							Transforms.setNodes(e, { type: tableRowElementType }, { at: childPath })
						}
					} else {
						return Transforms.removeNodes(e, { at: path })
					}
				}
			} else if (e.isTableRow(node)) {
				for (const [child, childPath] of SlateNode.children(e, path)) {
					if (SlateElement.isElement(child)) {
						if (!e.isTableCell(child)) {
							ContemberEditor.ejectElement(e, childPath)
							Transforms.setNodes(e, { type: tableCellElementType }, { at: childPath })
						}
					} else {
						return Transforms.removeNodes(e, { at: path })
					}
				}
			} else if (e.isTableCell(node)) {
				if (node.children.length === 1) {
					const onlyChild = node.children[0]
					if (SlateElement.isElement(onlyChild) && e.isDefaultElement(onlyChild)) {
						Transforms.unwrapNodes(e, {
							at: [...path, 0],
						})
					}
				}
			}
			normalizeNode(entry)
		},
	})

	return (editor as unknown) as EditorWithTables<E>
}
