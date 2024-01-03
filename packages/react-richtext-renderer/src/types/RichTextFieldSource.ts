import { RichTextElement, RichTextLeaf, RootEditorNode } from './structure'

export interface RichTextFieldSource<CustomElements extends RichTextElement, CustomLeaves extends RichTextLeaf> {
	source: RootEditorNode<CustomElements, CustomLeaves> | string | null
	deserialize?: (source: string) => RootEditorNode<CustomElements, CustomLeaves>
}
