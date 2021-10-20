import type { BaseEditor, CustomElementPlugin, ElementNode } from '../../../baseEditor'
import { Editor, Element as SlateElement, Node as SlateNode, Range as SlateRange, Transforms } from 'slate'
import { HorizontalRuleRenderer } from './HorizontalRuleRenderer'

export const horizontalRuleElementType = 'horizontalRule' as const

export interface HorizontalRuleElement extends ElementNode {
	type: typeof horizontalRuleElementType
	children: BaseEditor['children']
}

export const isHorizontalRuleElement = (element: SlateNode): element is HorizontalRuleElement =>
	SlateElement.isElement(element) && element.type === horizontalRuleElementType

export const isHorizontalRuleElementActive = (editor: Editor) => {
	const [hr] = Editor.nodes(editor, { match: isHorizontalRuleElement })
	return !!hr
}

export const horizontalRuleElementPlugin: CustomElementPlugin<HorizontalRuleElement> = {
	type: horizontalRuleElementType,
	render: HorizontalRuleRenderer,
	isVoid: true,
	toggleElement: ({ editor }) => {
		if (isHorizontalRuleElementActive(editor)) {
			removeHorizontalRule(editor)
		} else {
			insertHorizontalRule(editor)
		}
	},
}

const removeHorizontalRule = (editor: Editor) => {
	Transforms.removeNodes(editor, { match: isHorizontalRuleElement })
}

const insertHorizontalRule = (editor: Editor) => {
	const selection = editor.selection
	const isCollapsed = selection ? SlateRange.isCollapsed(selection!) : false

	if (!isCollapsed || isHorizontalRuleElementActive(editor)) {
		return
	}
	const horizontalRule: HorizontalRuleElement = {
		type: horizontalRuleElementType,
		children: [{ text: '' }],
	}
	Transforms.insertNodes(editor, horizontalRule)
}
