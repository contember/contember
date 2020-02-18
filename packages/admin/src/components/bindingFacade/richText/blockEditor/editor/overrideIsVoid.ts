import { isContemberBlockElement } from '../elements'
import { BlockSlateEditor } from './BlockSlateEditor'

export const overrideIsVoid = <E extends BlockSlateEditor>(editor: E) => {
	const { isVoid } = editor

	editor.isVoid = element => isContemberBlockElement(element) || isVoid(element)
}
