import { BlockSlateEditor } from './BlockSlateEditor'

export const overrideIsVoid = <E extends BlockSlateEditor>(editor: E) => {
	const { isVoid } = editor

	editor.isVoid = element =>
		editor.isContemberBlockElement(element) || editor.isContemberEmbedElement(element) || isVoid(element)
}
