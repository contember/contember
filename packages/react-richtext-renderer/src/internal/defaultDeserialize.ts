import type { RichTextElement } from '../types/structure/RichTextElement.js'
import type { RichTextLeaf } from '../types/structure/RichTextLeaf.js'
import type { RootEditorNode } from '../types/structure/RootEditorNode.js'

export const defaultDeserialize = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
>(
	source: string,
): RootEditorNode<CustomElements, CustomLeaves> => {
	try {
		return JSON.parse(source)
	} catch (e) {
		return {
			formatVersion: 0,
			children: [],
		}
	}
}
