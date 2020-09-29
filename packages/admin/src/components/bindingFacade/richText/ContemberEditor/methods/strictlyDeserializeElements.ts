import { BaseEditor, ElementNode, SerializableEditorNode } from '../../baseEditor'
import { toLatestFormat } from './toLatestFormat'

export const strictlyDeserializeElements = <E extends BaseEditor>(
	editor: E,
	serializedElement: string,
	errorMessage?: string,
): ElementNode[] => {
	try {
		const deserialized: SerializableEditorNode = JSON.parse(serializedElement)
		return toLatestFormat(editor, deserialized).children
	} catch (e) {
		throw new Error(errorMessage || `Editor: deserialization error`)
	}
}
