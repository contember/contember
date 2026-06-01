import type { RichTextElement, RichTextLeaf, RootEditorNode } from './structure/index.js'
import type { RichTextReference } from './RichTextReference.js'

export interface RichTextBlock<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> {
	content: RootEditorNode<CustomElements, CustomLeaves>
	references: Record<string, RichTextReference> | undefined
	id: string | undefined
}
