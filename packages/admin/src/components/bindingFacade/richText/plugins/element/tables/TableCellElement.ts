import type { BaseEditor, ElementNode } from '../../../baseEditor'
import { Element, Element as SlateElement, Node, Transforms } from 'slate'
import { ContemberEditor } from '../../../ContemberEditor'
import { tableRowElementType } from './TableRowElement'
import { TableCellElementRenderer } from './TableCellElementRenderer'
import { CustomElementPlugin } from '../../../baseEditor'

export const tableCellElementType = 'tableCell' as const

export interface TableCellElement extends ElementNode {
	type: typeof tableCellElementType
	children: BaseEditor['children']
	headerScope?: 'row'
	justify?: 'start' | 'center' | 'end'
}

export const isTableCellElement = (element: Node): element is TableCellElement => Element.isElement(element) && element.type === tableCellElementType

export const createEmptyTableCellElement = () => ({
	type: tableCellElementType,
	children: [{ text: '' }],
})


export const tableCellElementPlugin: CustomElementPlugin<TableCellElement> = {
	type: tableCellElementType,
	render: TableCellElementRenderer,
	normalizeNode: ({ element, editor, path }) => {
		if (element.children.length === 1) {
			const onlyChild = element.children[0]
			if (SlateElement.isElement(onlyChild) && editor.isDefaultElement(onlyChild)) {
				Transforms.unwrapNodes(editor, {
					at: [...path, 0],
				})
			}
		}
		if (!ContemberEditor.hasParentOfType(editor, [element, path], tableRowElementType)) {
			return Transforms.unwrapNodes(editor, { at: path })
		}
		if (path[path.length - 1] > 0 && element.headerScope) {
			return Transforms.setNodes(editor, { headerScope: null }, { at: path })
		}
	},
	canContainAnyBlocks: true,
}
