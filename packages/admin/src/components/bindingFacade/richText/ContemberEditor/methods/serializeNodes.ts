import type { SerializableEditorNode } from '../../baseEditor'
import { Editor as SlateEditor, Element as SlateElement, Text as SlateText } from 'slate'

export const serializeNodes = <E extends SlateEditor>(
	editor: E,
	elements: Array<SlateElement | SlateText>,
	errorMessage?: string,
) => {
	try {
		const serialized: SerializableEditorNode = {
			formatVersion: editor.formatVersion,
			children: elements,
		}
		return JSON.stringify(serialized)
	} catch (e) {
		throw new Error(errorMessage || `Editor: serialization error`)
	}
}
