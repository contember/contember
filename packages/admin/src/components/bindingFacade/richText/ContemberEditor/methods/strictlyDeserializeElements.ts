import { BaseEditor, ElementNode, SerializableEditorNode } from '../../baseEditor'

export const strictlyDeserializeElements = <E extends BaseEditor>(
	editor: E,
	serializedElement: string,
	errorMessage?: string,
): ElementNode[] => {
	try {
		const deserialized: SerializableEditorNode = JSON.parse(serializedElement)
		return deserialized.children
	} catch (e) {
		throw new Error(errorMessage || `Editor: deserialization error`)
	}
}
