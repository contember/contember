import { Editor, Element as SlateElement, Location } from 'slate'
import { BaseEditor } from '../../baseEditor'

export const closestBlockEntry = <E extends BaseEditor>(editor: E, at?: Location) => {
	return Editor.above(editor, {
		at,
		mode: 'lowest',
		match: matchedNode => SlateElement.isElement(matchedNode) && !editor.isInline(matchedNode),
	})
}
