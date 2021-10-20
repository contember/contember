import type { BaseEditor, ElementNode, SerializableEditorNode, TextNode } from '../../baseEditor'
import { toLatestFormat } from './toLatestFormat'

export const permissivelyDeserializeNodes = <E extends BaseEditor>(
	editor: E,
	serializedElement: string,
	errorMessage?: string,
): Array<ElementNode | TextNode> => {
	let deserialized: SerializableEditorNode | ElementNode
	try {
		// It is important that only the JSON.parse call is inside the try block.
		// We don't want to catch other exceptions from here.
		deserialized = JSON.parse(serializedElement)
	} catch (e) {
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
