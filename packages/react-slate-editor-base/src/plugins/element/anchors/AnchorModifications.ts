import { Editor, Range, Transforms } from 'slate'
import { AnchorElement, isAnchorElement, isAnchorElementActive } from './AnchorElement'

export class AnchorModifications {
	public static unwrapAnchor(editor: Editor) {
		Transforms.unwrapNodes(editor, { match: isAnchorElement })
	}

	public static wrapAnchor(editor: Editor, url: string) {
		if (isAnchorElementActive(editor)) {
			AnchorModifications.unwrapAnchor(editor)
		}

		const selection = editor.selection
		const isCollapsed = selection ? Range.isCollapsed(selection!) : false
		const anchor: AnchorElement = {
			type: 'anchor',
			href: url,
			children: isCollapsed ? [{ text: url }] : [{ text: '' }],
		}

		if (isCollapsed) {
			Transforms.insertNodes(editor, anchor)
		} else {
			Transforms.wrapNodes(editor, anchor, { split: true })
			Transforms.collapse(editor, { edge: 'end' })
		}
	}
}
