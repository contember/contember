import type { SerializableEditorNode } from '../../baseEditor'
import { toLatestFormat } from './toLatestFormat'
import { Editor as SlateEditor, Element as SlateElement, Text as SlateText } from 'slate'

export const permissivelyDeserializeNodes = <E extends SlateEditor>(
	editor: E,
	serializedElement: string,
	errorMessage?: string,
): Array<SlateElement | SlateText> => {
	let deserialized: SerializableEditorNode | SlateElement | null = null
	try {
		// It is important that only the JSON.parse call is inside the try block.
		// We don't want to catch other exceptions from here.
		deserialized = JSON.parse(serializedElement)
	} catch (e) {}

	if (typeof deserialized !== 'object' || deserialized === null) {
		return [editor.createDefaultElement([{ text: serializedElement }])]
	}

	if ('formatVersion' in deserialized) {
		return toLatestFormat(editor, deserialized as SerializableEditorNode).children
	}

	// If no format version is specified, assume zero.
	return toLatestFormat(editor, {
		formatVersion: 0,
		children: [deserialized],
	}).children
}
