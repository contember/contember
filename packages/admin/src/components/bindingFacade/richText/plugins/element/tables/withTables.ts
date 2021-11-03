import {
	Editor,
	Node as SlateNode,
	NodeEntry,
	Path as SlatePath,
	Point,
	Range as SlateRange,
	Text,
	Transforms,
	Element,
} from 'slate'
import { ContemberEditor } from '../../../ContemberEditor'
import { isTableCellElement, TableCellElement, tableCellElementPlugin } from './TableCellElement'
import {
	getTableElementColumnCount,
	getTableElementRowCount,
	isTableElement,
	TableElement,
	tableElementPlugin,
} from './TableElement'
import { isTableRowElement, tableRowElementPlugin } from './TableRowElement'
import { getTableCellCoordinates, selectTableCellContents } from './TableElementSelection'

export const withTables = <E extends Editor>(editor: E): E => {
	const {
		deleteForward,
		deleteBackward,
		deleteFragment,
		insertBreak,
		onKeyDown,
	} = editor

	editor.registerElement(tableElementPlugin)
	editor.registerElement(tableCellElementPlugin)
	editor.registerElement(tableRowElementPlugin)

	Object.assign<Editor, Partial<Editor>>(editor, {
		insertBreak: () => {
			const closestBlockEntry = ContemberEditor.closestBlockEntry(editor)
			if (closestBlockEntry && isTableCellElement(closestBlockEntry[0])) {
				const selection = editor.selection
				const [, closestBlockPath] = closestBlockEntry
				const [cellStart, cellEnd] = Editor.edges(editor, closestBlockPath)

				if (!selection) {
					return insertBreak()
				}

				return Editor.withoutNormalizing(editor, () => {
					Transforms.wrapNodes(editor, editor.createDefaultElement([]), {
						at: {
							anchor: cellStart,
							focus: cellEnd,
						},
						match: node => Text.isText(node) || (Element.isElement(node) && editor.isInline(node)),
					})

					const relative = SlatePath.relative(selection.focus.path, closestBlockPath)
					Transforms.splitNodes(editor, {
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
				const closestBlockEntry = ContemberEditor.closestBlockEntry(editor)
				if (
					closestBlockEntry &&
					isTableCellElement(closestBlockEntry[0]) &&
					Point.equals(selection.focus, Editor.start(editor, closestBlockEntry[1]))
				) {
					return
				}
			}
			deleteBackward(unit)
		},
		deleteForward: unit => {
			const selection = editor.selection
			if (selection && SlateRange.isCollapsed(selection)) {
				const closestBlockEntry = ContemberEditor.closestBlockEntry(editor)
				if (
					closestBlockEntry &&
					isTableCellElement(closestBlockEntry[0]) &&
					Point.equals(selection.focus, Editor.end(editor, closestBlockEntry[1]))
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
			const [lowestCommonAncestor] = Editor.node(editor, lowestCommonAncestorPath)

			if (isTableElement(lowestCommonAncestor) || isTableRowElement(lowestCommonAncestor)) {
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
			const closestBlockEntry = ContemberEditor.closestBlockEntry(editor, { at: selection })

			if (!closestBlockEntry) {
				return onKeyDown(event)
			}
			let cellElement: TableCellElement
			let cellPath: SlatePath

			if (!isTableCellElement(closestBlockEntry[0])) {
				const parent = SlateNode.parent(editor, closestBlockEntry[1])
				if (Element.isElement(closestBlockEntry[0]) && editor.isDefaultElement(closestBlockEntry[0]) && isTableCellElement(parent)) {
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
			const [rowIndex, columnIndex] = getTableCellCoordinates(editor, cellElement)
			const tablePath = cellPath.slice(0, -2)
			const tableElement = SlateNode.get(editor, tablePath) as TableElement
			const rowCount = getTableElementRowCount(tableElement)
			const columnCount = getTableElementColumnCount(tableElement)

			if (rowCount === 0 || columnCount === 0) {
				return
			}

			const moveSelectionBeforeTable = () => {
				const pointBeforeTable = Editor.before(editor, tablePath)
				if (!pointBeforeTable) {
					return onKeyDown(event)
				}
				event.preventDefault()
				return Transforms.select(editor, pointBeforeTable)
			}
			const moveSelectionAfterTable = () => {
				const pointAfterTable = Editor.after(editor, tablePath)
				if (!pointAfterTable) {
					return onKeyDown(event)
				}
				event.preventDefault()
				return Transforms.select(editor, pointAfterTable)
			}

			if (event.key === 'Tab') {
				if (event.shiftKey) {
					// Moving backwards
					if (columnIndex > 0) {
						event.preventDefault()
						return selectTableCellContents(editor, tablePath, rowIndex, columnIndex - 1)
					} else if (columnIndex === 0) {
						if (rowIndex > 0) {
							event.preventDefault()
							return selectTableCellContents(editor, tablePath, rowIndex - 1, columnCount - 1)
						}
						return moveSelectionBeforeTable()
					}
				} else {
					// Moving forwards
					if (columnIndex < columnCount - 1) {
						event.preventDefault()
						return selectTableCellContents(editor, tablePath, rowIndex, columnIndex + 1)
					} else if (columnIndex === columnCount - 1) {
						// We're at the right edge of the table
						if (rowIndex < rowCount - 1) {
							event.preventDefault()
							return selectTableCellContents(editor, tablePath, rowIndex + 1, 0)
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
				if (Point.equals(selection.focus, Editor.start(editor, cellPath))) {
					if (columnIndex > 0) {
						event.preventDefault()
						return Transforms.select(editor, Editor.end(editor, [...tablePath, rowIndex, columnIndex - 1]))
					} else if (columnIndex === 0) {
						if (rowIndex > 0) {
							event.preventDefault()
							return Transforms.select(editor, Editor.end(editor, [...tablePath, rowIndex - 1, columnCount - 1]))
						}
						return moveSelectionBeforeTable()
					}
				}
			} else if (event.key === 'ArrowRight') {
				if (!SlateRange.isCollapsed(selection)) {
					return onKeyDown(event)
				}
				if (Point.equals(selection.focus, Editor.end(editor, cellPath))) {
					if (columnIndex < columnCount - 1) {
						event.preventDefault()
						return Transforms.select(editor, Editor.start(editor, [...tablePath, rowIndex, columnIndex + 1]))
					} else if (columnIndex === columnCount - 1) {
						if (rowIndex < rowCount - 1) {
							event.preventDefault()
							return Transforms.select(editor, Editor.start(editor, [...tablePath, rowIndex + 1, 0]))
						} else if (rowIndex === rowCount - 1) {
							return moveSelectionAfterTable()
						}
					}
				}
			} else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				const withinDefault = editor.isDefaultElement(closestBlockEntry[0])
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
						const rowAboveEndPoint = Editor.end(editor, [...tablePath, rowIndex - 1, columnIndex])

						if (!SlateRange.isCollapsed(selection)) {
							return Transforms.select(editor, rowAboveEndPoint)
						}
						const minOffset = Math.min(selection.focus.offset, rowAboveEndPoint.offset)
						return Transforms.select(editor, {
							path: rowAboveEndPoint.path,
							offset: minOffset,
						})
					}
					return moveSelectionBeforeTable()
				} else if (event.key === 'ArrowDown') {
					if (rowIndex < rowCount - 1) {
						event.preventDefault()
						const rowBelowStatPoint = Editor.start(editor, [...tablePath, rowIndex + 1, columnIndex])

						if (!SlateRange.isCollapsed(selection)) {
							return Transforms.select(editor, rowBelowStatPoint)
						}
						const [rowBelowStatPointNode] = Editor.node(editor, rowBelowStatPoint) as NodeEntry<Text>

						return Transforms.select(editor, {
							path: rowBelowStatPoint.path,
							offset: Math.min(selection.focus.offset, rowBelowStatPointNode.text.length),
						})
					}
					return moveSelectionAfterTable()
				}
			}
			onKeyDown(event)
		},

	})

	return editor
}
