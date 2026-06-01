import { Editor as SlateEditor, Element, Element as SlateElement, Node, Node as SlateNode, Transforms } from 'slate'
import { createEmptyTableCellElement, isTableCellElement, tableCellElementType } from './TableCellElement.js'
import { ContemberEditor } from '../../../editor/index.js'
import { tableElementType } from './TableElement.js'
import { EditorElementPlugin, ElementRenderer } from '../../../types/index.js'

export const tableRowElementType = 'tableRow' as const

export interface TableRowElement extends SlateElement {
	type: typeof tableRowElementType
	children: SlateEditor['children']
	headerScope?: 'table'
}

export const isTableRowElement = (element: Node): element is TableRowElement => Element.isElement(element) && element.type === tableRowElementType

export const createEmptyTableRowElement = (columnCount = 2) => ({
	type: tableRowElementType,
	children: Array.from({ length: columnCount }, () => createEmptyTableCellElement()),
})

export const tableRowElementPlugin = ({ render }: { render: ElementRenderer<TableRowElement> }): EditorElementPlugin<TableRowElement> => ({
	type: tableRowElementType,
	render,
	normalizeNode: ({ editor, path, element, preventDefault }) => {
		for (const [child, childPath] of SlateNode.children(editor, path)) {
			if (SlateElement.isElement(child)) {
				if (!isTableCellElement(child)) {
					ContemberEditor.ejectElement(editor, childPath)
					Transforms.setNodes(editor, { type: tableCellElementType }, { at: childPath })
				}
			} else {
				Transforms.removeNodes(editor, { at: path })
				return preventDefault()
			}
		}
		if (!ContemberEditor.hasParentOfType(editor, [element, path], tableElementType)) {
			Transforms.unwrapNodes(editor, { at: path })
			return preventDefault()
		}
		if (path[path.length - 1] > 0 && element.headerScope) {
			Transforms.setNodes(editor, { headerScope: null }, { at: path })
			return preventDefault()
		}
	},
	canContainAnyBlocks: false,
})
