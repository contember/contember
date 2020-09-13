import { Editor as SlateEditor, Element as SlateElement } from 'slate'
import { BaseEditor } from '../../baseEditor'

export const topLevelNodes = <E extends BaseEditor>(editor: E) => {
	// We manually filter out void nodes because it appears that Slate doesn't respect the voids setting from here.
	// The combination of isElement and mode: 'highest' is really just a roundabout way of excluding the Editor.
	return SlateEditor.nodes(editor, {
		match: node => SlateElement.isElement(node) && !editor.isVoid(node),
		mode: 'highest',
		voids: false,
	})
}
