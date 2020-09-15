import { Editor, Element as SlateElement, Location } from 'slate'
import { BaseEditor } from '../../baseEditor'

export const closestBlockEntry = <E extends BaseEditor>(editor: E, at?: Location) => {
	return Editor.above(editor, {
		at,
		match: node => Editor.isBlock(editor, node),
	})
}
