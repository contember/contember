import { Editor } from 'slate'
import { scrollTargetElementPlugin } from './ScrollTargetElement'

export const withScrollTargets = <E extends Editor>(editor: E): E => {
	editor.registerElement(scrollTargetElementPlugin)
	return editor
}
