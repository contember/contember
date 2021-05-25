import type { BaseEditor, ElementNode, SerializableEditorNode, TextNode } from '../../baseEditor'
import { toLatestFormat } from './toLatestFormat'

export const strictlyDeserializeNodes = <E extends BaseEditor>(
	editor: E,
	serializedElement: string,
	errorMessage?: string,
): Array<ElementNode | TextNode> => {
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
