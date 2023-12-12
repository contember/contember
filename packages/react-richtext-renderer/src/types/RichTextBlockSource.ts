import { RichTextElement, RichTextLeaf, RootEditorNode } from './structure'

export type RichTextBlockSource<CustomElements extends RichTextElement = never, CustomLeaves extends RichTextLeaf = RichTextLeaf> = {
	blocks: readonly Readonly<Record<string, unknown>>[]
	sourceField?: string
	referencesField?: string
	referenceDiscriminationField?: string

	deserialize?: (source: string) => RootEditorNode<CustomElements, CustomLeaves>
}
