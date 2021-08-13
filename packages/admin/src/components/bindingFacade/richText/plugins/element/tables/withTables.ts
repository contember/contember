import { createElement } from 'react'
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
import type { BaseEditor } from '../../../baseEditor'
import { ContemberEditor } from '../../../ContemberEditor'
import type { EditorWithTables } from './EditorWithTables'
import { gaugeTableColumnCount } from './gaugeTableColumnCount'
import { TableCellElement, tableCellElementType } from './TableCellElement'
import { TableCellElementRenderer, TableCellElementRendererProps } from './TableCellElementRenderer'
import { TableElement, tableElementType } from './TableElement'
import { TableElementRenderer, TableElementRendererProps } from './TableElementRenderer'
import { TableRowElement, tableRowElementType } from './TableRowElement'
import { TableRowElementRenderer, TableRowElementRendererProps } from './TableRowElementRenderer'

export const withTables = <E extends BaseEditor>(editor: E): EditorWithTables<E> => {
	const {
		canContainAnyBlocks,
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

	const e = editor as any as EditorWithTables<E>

	const forEachCellInColumn = (
		element: TableElement,
		columnIndex: number,
		callback: (cellEntry: NodeEntry<TableCellElement>) => void,
	) => {
		const tablePath = ReactEditor.findPath(e, element)
		const rowCount = e.getTableRowCount(element)

		Editor.withoutNormalizing(e, () => {
			for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
				callback(Editor.node(e, [...tablePath, rowIndex, columnIndex]) as NodeEntry<TableCellElement>)
			}
		})
	}
	const copyTableCell = (tableCellElement: TableCellElement): TableCellElement => ({
		...ContemberEditor.elementToSpecifics(tableCellElement),
		type: tableCellElementType,
		children: [{ text: '' }],
	})

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

			let tableRow: TableRowElement
			if (element.children.length === 0) {
				tableRow = e.createEmptyTableRowElement(columnCount)
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
						Transforms.setNodes(e, { headerScope: null }, { at: [...tablePath, 0] })
					}
				}
			}

			Transforms.insertNodes(e, tableRow, {
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
					const tableRow = element.children[rowIndex] as TableRowElement

					let tableCell: TableCellElement
					if (tableRow.children.length === 0) {
						tableCell = e.createEmptyTableCellElement()
					} else {
						tableCell = copyTableCell(tableRow.children[columnIndex === 0 ? 0 : columnIndex - 1] as TableCellElement)

						if (columnIndex === 0) {
							const firstCell = tableRow.children[0] as TableCellElement
							if (firstCell.headerScope) {
								Transforms.setNodes(e, { headerScope: null }, { at: [...tablePath, rowIndex, 0] })
							}
						}
					}

					Transforms.insertNodes(e, tableCell, {
						at: [...tablePath, rowIndex, columnIndex],
					})
				}
			})
		},
		justifyTableColumn: (element: TableElement, columnIndex: number, direction: TableCellElement['justify']) => {
			forEachCellInColumn(element, columnIndex, ([, cellPath]) => {
				Transforms.setNodes(
					editor,
					{ justify: direction ?? null },
					{ match: node => e.isTableCell(node), at: cellPath },
				)
			})
		},
		toggleTableRowHeaderScope: (element: TableElement, rowIndex: number, scope: TableRowElement['headerScope']) => {
			const rowCount = element.children.length
			if (rowIndex !== 0 || rowCount < 1) {
				return
			}
			const tablePath = ReactEditor.findPath(e, element)
			const firstRow = element.children[0] as TableRowElement

			Transforms.setNodes(
				editor,
				{ headerScope: firstRow.headerScope === scope ? null : scope },
				{ match: node => e.isTableRow(node), at: [...tablePath, 0] },
			)
		},
		toggleTableColumnHeaderScope: (
			element: TableElement,
			columnIndex: number,
			scope: TableCellElement['headerScope'],
		) => {
			let currentStatusScore = 0
			const rowCount = element.children.length

			forEachCellInColumn(element, columnIndex, ([cell]) => {
				currentStatusScore += cell.headerScope === scope ? 1 : -1
			})

			// If none have it or the majority does but not all.
			const shouldSetScope =
				-currentStatusScore === rowCount || (currentStatusScore > 0 && currentStatusScore !== rowCount)

			forEachCellInColumn(element, columnIndex, ([, cellPath]) => {
				Transforms.setNodes(
					editor,
					{ headerScope: shouldSetScope ? scope : null },
					{ match: node => e.isTableCell(node), at: cellPath },
				)
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
					return createElement(TableElementRenderer, props as TableElementRendererProps)
				case tableRowElementType:
					return createElement(TableRowElementRenderer, props as TableRowElementRendererProps)
				case tableCellElementType:
					return createElement(TableCellElementRenderer, props as TableCellElementRendererProps)
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
				const selection = editor.selection
				const [, closestBlockPath] = closestBlockEntry
				const [cellStart, cellEnd] = Editor.edges(editor, closestBlockPath)

				if (!selection) {
					return insertBreak()
				}

				return Editor.withoutNormalizing(e, () => {
					Transforms.wrapNodes(e, e.createDefaultElement([]), {
						at: {
							anchor: cellStart,
							focus: cellEnd,
						},
						match: node => Text.isText(node) || e.isInline(node),
					})

					const relative = SlatePath.relative(selection.focus.path, closestBlockPath)
					Transforms.splitNodes(e, {
						// The zero should be the newly created default element.
						at: {
							path: [...closestBlockPath, 0, ...relative],
							offset: selection.focus.offset,
						},
						always: true,
					})
				})
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
			const selection = editor.selection
			if (
				!selection ||
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
			const closestBlockEntry = ContemberEditor.closestBlockEntry(e, { at: selection })

			if (!closestBlockEntry) {
				return onKeyDown(event)
			}
			let cellElement: TableCellElement
			let cellPath: SlatePath

			if (!e.isTableCell(closestBlockEntry[0])) {
				const parent = SlateNode.parent(e, closestBlockEntry[1])
				if (e.isDefaultElement(closestBlockEntry[0]) && e.isTableCell(parent)) {
					cellElement = parent
					cellPath = SlatePath.parent(closestBlockEntry[1])
				} else {
					return onKeyDown(event)
				}
			} else {
				[cellElement, cellPath] = closestBlockEntry
			}
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
			} else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				const withinDefault = e.isDefaultElement(closestBlockEntry[0])
				if (withinDefault) {
					const relative = SlatePath.relative(closestBlockEntry[1], cellPath)
					const defaultIndex = relative[0]
					if (
						(event.key === 'ArrowUp' && defaultIndex !== 0) ||
						(event.key === 'ArrowDown' && defaultIndex !== cellElement.children.length - 1)
					) {
						return onKeyDown(event)
					}
				}
				if (event.key === 'ArrowUp') {
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
			}
			onKeyDown(event)
		},
		normalizeNode: entry => {
			const [node, path] = entry

			if (!SlateElement.isElement(node)) {
				return normalizeNode(entry)
			}
			if (e.isTable(node)) {
				if (node.children.length === 0) {
					return Transforms.removeNodes(e, { at: path })
				}

				let didTransform = false
				for (const [child, childPath] of SlateNode.children(e, path)) {
					if (SlateElement.isElement(child)) {
						if (!e.isTableRow(child)) {
							ContemberEditor.ejectElement(e, childPath)
							Transforms.setNodes(e, { type: tableRowElementType }, { at: childPath })
							didTransform = true
						}
					} else {
						return Transforms.removeNodes(e, { at: path })
					}
				}
				if (didTransform) {
					return
				}
				const columnCount = gaugeTableColumnCount(node)
				for (const [row, childPath] of SlateNode.children(e, path) as Iterable<NodeEntry<TableRowElement>>) {
					const currentColumnCount = row.children.length
					if (currentColumnCount === columnCount) {
						continue
					}

					// For the first row, we prepend or insert at the start which in most cases will likely preserve the
					// already existing cells' positions.
					if (currentColumnCount > columnCount) {
						const shouldBiasTowardsStart = childPath[childPath.length - 1] === 0
						for (let i = columnCount; i < currentColumnCount; i++) {
							Transforms.removeNodes(e, { at: [...childPath, shouldBiasTowardsStart ? 0 : i] })
						}
					} else if (currentColumnCount < columnCount) {
						const shouldBiasTowardsStart = childPath[childPath.length - 1] === 0
						for (let i = currentColumnCount; i < columnCount; i++) {
							Transforms.insertNodes(e, e.createEmptyTableCellElement(), {
								at: [...childPath, shouldBiasTowardsStart ? 0 : i],
							})
						}
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
				if (!ContemberEditor.hasParentOfType(e, entry, tableElementType)) {
					return Transforms.unwrapNodes(e, { at: path })
				}
				if (path[path.length - 1] > 0 && node.headerScope) {
					return Transforms.setNodes(e, { headerScope: null }, { at: path })
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
				if (!ContemberEditor.hasParentOfType(e, entry, tableRowElementType)) {
					return Transforms.unwrapNodes(e, { at: path })
				}
				if (path[path.length - 1] > 0 && node.headerScope) {
					return Transforms.setNodes(e, { headerScope: null }, { at: path })
				}
			}
			normalizeNode(entry)
		},
		canContainAnyBlocks: element => {
			switch (element.type) {
				case tableElementType:
				case tableRowElementType:
					return false
				case tableCellElementType:
					return true
				default:
					return canContainAnyBlocks(element)
			}
		},
	})

	return editor as unknown as EditorWithTables<E>
}
