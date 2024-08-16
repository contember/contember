import type { RichTextElement, RichTextLeaf, RootEditorNode } from './structure'
import type { RichTextReference } from './RichTextReference'

export interface RichTextBlock<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> {
	content: RootEditorNode<CustomElements, CustomLeaves>
	references: Record<string, RichTextReference> | undefined
	id: string | undefined
}
