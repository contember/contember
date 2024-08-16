import { Editor as SlateEditor, Editor, Element as SlateElement, Node as SlateNode, Path, Range as SlateRange, Transforms } from 'slate'
import { AnchorModifications } from './AnchorModifications'
import { EditorElementPlugin, ElementRenderer } from '../../../types'

export const anchorElementType = 'anchor' as const

export interface AnchorElement extends SlateElement {
	type: typeof anchorElementType
	href: string
	children: SlateEditor['children']
}

export const isAnchorElement = (element: SlateNode): element is AnchorElement => SlateElement.isElement(element) && element.type === anchorElementType

export const isAnchorElementActive = (editor: Editor) => {
	const [link] = Editor.nodes(editor, { match: isAnchorElement })
	return !!link
}


export const anchorElementPlugin = ({ render }: { render: ElementRenderer<AnchorElement> }): EditorElementPlugin<AnchorElement> => ({
	type: anchorElementType,
	isInline: true,
	render,
	isActive: ({ editor }) => isAnchorElementActive(editor),
	toggleElement: ({ editor, suchThat }) => {
		if (isAnchorElementActive(editor)) {
			AnchorModifications.unwrapAnchor(editor)
		} else {
			const href = suchThat?.href ?? prompt('Insert the URL:')
			if (!href) {
				return
			}
			AnchorModifications.wrapAnchor(editor, href)
		}
	},
	normalizeNode: ({ element, path, editor, preventDefault }) => {
		if (SlateNode.string(element) === '') {
			const selection = editor.selection
			Transforms.removeNodes(editor, {
				at: path,
			})
			if (selection && SlateRange.isCollapsed(selection) && Path.isCommon(path, selection.focus.path)) {
				Transforms.select(editor, Path.parent(path))
			}
			return preventDefault()
		}
	},
})
