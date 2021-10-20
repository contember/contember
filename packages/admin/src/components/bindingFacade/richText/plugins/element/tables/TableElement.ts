import type { BaseEditor, ElementNode } from '../../../baseEditor'
import { CustomElementPlugin } from '../../../baseEditor'
import {
	Editor,
	Element as SlateElement,
	Element,
	Node as SlateNode,
	Node,
	NodeEntry,
	Path as SlatePath,
	Range as SlateRange,
	Transforms,
} from 'slate'
import { createEmptyTableRowElement, isTableRowElement, TableRowElement, tableRowElementType } from './TableRowElement'
import { TableElementRenderer } from './TableElementRenderer'
import { ContemberEditor } from '../../../ContemberEditor'
import { gaugeTableColumnCount } from './gaugeTableColumnCount'
import { createEmptyTableCellElement } from './TableCellElement'

export const tableElementType = 'table' as const

export interface TableElement extends ElementNode {
	type: typeof tableElementType
	children: BaseEditor['children']
}

export const isTableElement = (element: Node): element is TableElement => Element.isElement(element) && element.type === tableElementType

export const createEmptyTableElement = (rowCount = 3, columnCount = 2) => ({
	type: tableElementType,
	children: Array.from({ length: rowCount }, () => createEmptyTableRowElement(columnCount)),
})

export const getTableElementRowCount = (element: TableElement): number => {
	return element.children.length
}

export const getTableElementColumnCount = (element: TableElement): number => {
	const firstRow = element.children[0] as TableRowElement | undefined
	return firstRow?.children.length ?? 0
}

export const tableElementPlugin: CustomElementPlugin<TableElement> = {
	type: tableElementType,
	render: TableElementRenderer,
	normalizeNode: ({ editor, element, path }) => {
		if (element.children.length === 0) {
			return Transforms.removeNodes(editor, { at: path })
		}

		let didTransform = false
		for (const [child, childPath] of SlateNode.children(editor, path)) {
			if (SlateElement.isElement(child)) {
				if (!isTableRowElement(child)) {
					ContemberEditor.ejectElement(editor, childPath)
					Transforms.setNodes(editor, { type: tableRowElementType }, { at: childPath })
					didTransform = true
				}
			} else {
				return Transforms.removeNodes(editor, { at: path })
			}
		}
		if (didTransform) {
			return
		}
		const columnCount = gaugeTableColumnCount(element)
		for (const [row, childPath] of SlateNode.children(editor, path) as Iterable<NodeEntry<TableRowElement>>) {
			const currentColumnCount = row.children.length
			if (currentColumnCount === columnCount) {
				continue
			}

			// For the first row, we prepend or insert at the start which in most cases will likely preserve the
			// already existing cells' positions.
			if (currentColumnCount > columnCount) {
				const shouldBiasTowardsStart = childPath[childPath.length - 1] === 0
				for (let i = columnCount; i < currentColumnCount; i++) {
					Transforms.removeNodes(editor, { at: [...childPath, shouldBiasTowardsStart ? 0 : i] })
				}
			} else if (currentColumnCount < columnCount) {
				const shouldBiasTowardsStart = childPath[childPath.length - 1] === 0
				for (let i = currentColumnCount; i < columnCount; i++) {
					Transforms.insertNodes(editor, createEmptyTableCellElement(), {
						at: [...childPath, shouldBiasTowardsStart ? 0 : i],
					})
				}
			}
		}
		return true
	},
	canContainAnyBlocks: false,
	toggleElement: ({ editor }) => {
		const closestTableEntry = Editor.above(editor, {
			mode: 'lowest',
			match: matchedNode => SlateElement.isElement(matchedNode) && isTableElement(matchedNode),
		})
		if (closestTableEntry) {
			return
		}
		const { selection } = editor
		if (!selection || SlateRange.isExpanded(selection)) {
			return
		}

		const closestDefaultEntry: NodeEntry | undefined = Editor.above(editor, {
			at: selection.focus,
			mode: 'lowest',
			match: matchedNode => SlateElement.isElement(matchedNode) && editor.isDefaultElement(matchedNode),
		})
		if (!closestDefaultEntry) {
			return
		}
		const [closestDefault, closestDefaultPath] = closestDefaultEntry

		if (closestDefaultPath.length !== 1) {
			return // We only support tables at the very top level
		}

		Editor.withoutNormalizing(editor, () => {
			let targetPath: SlatePath
			if (SlateNode.string(closestDefault) === '') {
				Transforms.removeNodes(editor, {
					at: closestDefaultPath,
				})
				targetPath = closestDefaultPath
			} else {
				targetPath = [closestDefaultPath[0] + 1]
			}
			const table = createEmptyTableElement()

			Transforms.insertNodes(editor, table, {
				at: targetPath,
			})
		})
	},
}
