import { RichTextElement } from './RichTextElement'
import { RichTextLeaf } from './RichTextLeaf'
import { RootEditorNode } from './RootEditorNode'

export const defaultDeserialize = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
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
