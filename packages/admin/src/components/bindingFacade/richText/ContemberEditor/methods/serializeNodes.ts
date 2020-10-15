import { BaseEditor, ElementNode, SerializableEditorNode, TextNode } from '../../baseEditor'

export const serializeNodes = <E extends BaseEditor>(
	editor: E,
	elements: Array<ElementNode | TextNode>,
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
