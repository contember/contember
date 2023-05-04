import type { CustomElementPlugin } from '../../../baseEditor'
import { ScrollTargetRenderer } from './ScrollTargetRenderer'
import {
	Editor as SlateEditor,
	Editor,
	Element as SlateElement,
	Node as SlateNode,
	Range as SlateRange,
	Transforms,
} from 'slate'

export const scrollTargetElementType = 'scrollTarget' as const

export interface ScrollTargetElement extends SlateElement {
	type: typeof scrollTargetElementType
	identifier: string
	children: SlateEditor['children']
}

export const isScrollTargetElement = (element: SlateNode): element is ScrollTargetElement =>
	SlateElement.isElement(element) && element.type === scrollTargetElementType

export const isScrollTargetElementActive = (editor: Editor) => {
	const [link] = Editor.nodes(editor, { match: isScrollTargetElement })
	return !!link
}

export const scrollTargetElementPlugin: CustomElementPlugin<ScrollTargetElement> = {
	type: scrollTargetElementType,
	render: ScrollTargetRenderer,
	isActive: ({ editor }) => isScrollTargetElementActive(editor),
	isInline: true,
	isVoid: true,
	toggleElement: ({ editor, suchThat }) => {
		if (isScrollTargetElementActive(editor)) {
			unwrapScrollTarget(editor)
		} else {
			let identifier =
				suchThat?.identifier ??
				prompt('Insert the identifier:')

			if (!identifier) {
				return
			}
			wrapScrollTarget(editor, identifier)
		}
	},
}
const unwrapScrollTarget = (editor: Editor) => {
	Transforms.removeNodes(editor, { match: isScrollTargetElement })
}
const wrapScrollTarget = (editor: Editor, identifier: string) => {
	if (isScrollTargetElementActive(editor)) {
		unwrapScrollTarget(editor)
	}

	const selection = editor.selection
	const isCollapsed = selection ? SlateRange.isCollapsed(selection!) : false
	const ScrollTarget: ScrollTargetElement = {
		type: scrollTargetElementType,
		identifier,
		children: [{ text: '' }],
	}

	if (!isCollapsed) {
		Transforms.collapse(editor, { edge: 'start' })
	}
	Transforms.insertNodes(editor, ScrollTarget)
}
