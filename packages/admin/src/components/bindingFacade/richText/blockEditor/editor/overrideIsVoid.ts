import { BlockSlateEditor } from './BlockSlateEditor'

export const overrideIsVoid = <E extends BlockSlateEditor>(editor: E) => {
	const { isVoid } = editor

	editor.isVoid = element =>
		editor.isBlockVoidReferenceElement(element) || editor.isEmbedElement(element) || isVoid(element)
}
