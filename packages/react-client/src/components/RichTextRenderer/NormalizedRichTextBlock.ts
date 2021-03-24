import { ReferenceRenderer } from './ReferenceRenderer'
import { RichTextElement } from './RichTextElement'
import { RichTextLeaf } from './RichTextLeaf'
import { RichTextReference } from './RichTextReference'
import { RootEditorNode } from './RootEditorNode'

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
