import type { SerializableEditorNode } from '../../baseEditor'
import { toLatestFormat } from './toLatestFormat'
import { Editor as SlateEditor, Element as SlateElement, Text as SlateText } from 'slate'

export const strictlyDeserializeNodes = <E extends SlateEditor>(
	editor: E,
	serializedElement: string,
	errorMessage?: string,
): Array<SlateElement | SlateText> => {
	let deserialized: SerializableEditorNode
	try {
		// It is important that only the JSON.parse call is inside the try block.
		// We don't want to catch other exceptions from here.
		deserialized = JSON.parse(serializedElement)
	} catch (e) {
		throw new Error(errorMessage || `Editor: deserialization error`)
	}
	return toLatestFormat(editor, deserialized).children
}
