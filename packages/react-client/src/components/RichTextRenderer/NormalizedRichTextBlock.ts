import type { ReferenceRenderer } from './ReferenceRenderer'
import type { RichTextElement } from './RichTextElement'
import type { RichTextLeaf } from './RichTextLeaf'
import type { RichTextReference } from './RichTextReference'
import type { RootEditorNode } from './RootEditorNode'

export interface NormalizedRichTextBlock<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> {
	content: RootEditorNode<CustomElements, CustomLeaves>
	referenceRenderers: Record<string, ReferenceRenderer<RichTextReference, CustomElements, CustomLeaves>>
	references: Map<string, RichTextReference> | undefined
	referencesField: string | undefined
	referenceDiscriminationField: string | undefined
	id: string | undefined
}
