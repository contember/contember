import { BaseEditor, ElementNode, SerializableEditorNode } from '../baseEditor'

export const serializeElements = <E extends BaseEditor>(editor: E, elements: ElementNode[], errorMessage?: string) => {
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
